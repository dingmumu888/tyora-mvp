import { createHash } from "node:crypto";

import { mapLegacyWorkflowStatus } from "../../lib/server/submission-workflow-policy.ts";

const sourceDefinitions = [
  {
    recordKind: "COMMUNITY_IDEA",
    submissionType: "IDEA",
    table: "CommunityIdea",
    query: `
      SELECT idea."id", idea."status", idea."visibility", idea."createdAt",
             idea."country", user_row."id" AS "communityUserId",
             user_row."name", user_row."username", user_row."email",
             user_row."country" AS "userCountry"
      FROM "CommunityIdea" AS idea
      JOIN "CommunityUser" AS user_row ON user_row."id" = idea."authorId"
      ORDER BY idea."id"
    `
  },
  {
    recordKind: "CUSTOM_INQUIRY",
    submissionType: "CUSTOM",
    table: "CustomInquiry",
    query: `
      SELECT inquiry."id", inquiry."status", inquiry."createdAt", inquiry."targetMarket",
             inquiry."contactEmail", inquiry."contactWhatsapp",
             user_row."id" AS "communityUserId", user_row."name", user_row."username",
             user_row."email", user_row."country" AS "userCountry"
      FROM "CustomInquiry" AS inquiry
      JOIN "CommunityUser" AS user_row ON user_row."id" = inquiry."userId"
      ORDER BY inquiry."id"
    `
  },
  {
    recordKind: "SOURCE_REQUEST",
    submissionType: "SOURCE",
    table: "SourceRequest",
    query: `
      SELECT "id", "status", "createdAt", "email", "whatsapp", "destinationCountry"
      FROM "SourceRequest"
      ORDER BY "id"
    `
  },
  {
    recordKind: "LEAD",
    submissionType: "PROJECT",
    table: "Lead",
    query: `
      SELECT "id", "status", "submissionDate", "ownerId", "customerName", "company", "email", "country"
      FROM "Lead"
      ORDER BY "id"
    `
  }
];

function stableId(prefix, value) {
  return `${prefix}-${createHash("sha256").update(value).digest("hex").slice(0, 40)}`;
}

function customerSnapshot(recordKind, row) {
  if (recordKind === "COMMUNITY_IDEA") {
    return {
      communityUserId: row.communityUserId,
      displayName: row.name || row.username,
      email: row.email,
      country: row.country || row.userCountry
    };
  }
  if (recordKind === "CUSTOM_INQUIRY") {
    return {
      communityUserId: row.communityUserId,
      displayName: row.name || row.username,
      email: row.contactEmail || row.email,
      whatsapp: row.contactWhatsapp,
      targetMarket: row.targetMarket,
      country: row.userCountry
    };
  }
  if (recordKind === "SOURCE_REQUEST") {
    return {
      email: row.email,
      whatsapp: row.whatsapp,
      destinationCountry: row.destinationCountry
    };
  }
  return {
    customerName: row.customerName,
    company: row.company,
    email: row.email,
    country: row.country
  };
}

function submittedAt(recordKind, row) {
  return recordKind === "LEAD" ? row.submissionDate : row.createdAt;
}

function privacyState(recordKind, row) {
  return recordKind === "COMMUNITY_IDEA" && row.visibility === "Public" ? "PUBLIC" : "PRIVATE";
}

async function loadTeamMemberIds(client) {
  const result = await client.query(`SELECT "id" FROM "TeamMember"`);
  return new Set(result.rows.map((row) => row.id));
}

function expectedWorkflow(definition, row, teamMemberIds) {
  const mapping = mapLegacyWorkflowStatus(definition.recordKind, row.status);
  const requestedOwner = definition.recordKind === "LEAD" && row.ownerId && row.ownerId !== "unassigned"
    ? row.ownerId
    : null;
  const ownerIsValid = Boolean(requestedOwner && teamMemberIds.has(requestedOwner));
  const ownerNeedsReview = Boolean(requestedOwner && !ownerIsValid);
  const manualReviewRequired = mapping.manualReviewRequired || ownerNeedsReview;
  const manualReviewReason = [
    mapping.manualReviewReason,
    ownerNeedsReview ? "Legacy Lead owner does not match an existing TeamMember." : null
  ].filter(Boolean).join(" ") || null;
  const workflowId = stableId("SWF", `${definition.recordKind}:${row.id}`);
  const eventId = stableId("WSE", `${workflowId}:initial`);
  return {
    id: workflowId,
    eventId,
    recordKind: definition.recordKind,
    sourceId: row.id,
    submissionType: definition.submissionType,
    qualification: mapping.qualification,
    workflowStatus: mapping.workflowStatus,
    assignedOwnerId: ownerIsValid ? requestedOwner : null,
    customerSnapshotJson: JSON.stringify(customerSnapshot(definition.recordKind, row)),
    privacyState: privacyState(definition.recordKind, row),
    legacyStatus: row.status,
    manualReviewRequired,
    manualReviewReason,
    submittedAt: submittedAt(definition.recordKind, row)
  };
}

async function insertWorkflow(client, expected) {
  const inserted = await client.query(
    `INSERT INTO "SubmissionWorkflow" (
       "id", "recordKind", "sourceId", "submissionType", "qualification", "workflowStatus",
       "assignedOwnerId", "customerSnapshotJson", "privacyState", "legacyStatus",
       "manualReviewRequired", "manualReviewReason", "submittedAt", "createdAt", "updatedAt"
     ) VALUES ($1, $2::"SubmissionRecordKind", $3, $4::"SubmissionType", $5::"WorkflowQualification",
       $6::"SubmissionWorkflowStatus", $7, $8, $9::"WorkflowPrivacyState", $10, $11, $12, $13, now(), now())
     ON CONFLICT ("recordKind", "sourceId") DO NOTHING
     RETURNING "id"`,
    [
      expected.id,
      expected.recordKind,
      expected.sourceId,
      expected.submissionType,
      expected.qualification,
      expected.workflowStatus,
      expected.assignedOwnerId,
      expected.customerSnapshotJson,
      expected.privacyState,
      expected.legacyStatus,
      expected.manualReviewRequired,
      expected.manualReviewReason,
      expected.submittedAt
    ]
  );
  if (inserted.rowCount === 1) {
    await client.query(
      `INSERT INTO "WorkflowStatusEvent" (
         "id", "workflowId", "previousStatus", "newStatus", "actorId",
         "actorIdentifierSnapshot", "actorLabelSnapshot", "note", "createdAt"
       ) VALUES ($1, $2, NULL, $3::"SubmissionWorkflowStatus", NULL, $4, $5, $6, now())`,
      [
        expected.eventId,
        expected.id,
        expected.workflowStatus,
        "system:phase-5b-backfill",
        "Phase 5B Preview backfill",
        "Initial workflow state copied from the preserved legacy status."
      ]
    );
    return true;
  }
  return false;
}

function sameTimestamp(left, right) {
  const leftTime = left instanceof Date ? left.getTime() : new Date(left).getTime();
  const rightTime = right instanceof Date ? right.getTime() : new Date(right).getTime();
  return Number.isFinite(leftTime) && leftTime === rightTime;
}

async function assertWorkflowContents(client, expectedRows) {
  const result = await client.query(`
    SELECT "id", "recordKind", "sourceId", "submissionType", "qualification",
           "workflowStatus", "assignedOwnerId", "customerSnapshotJson", "privacyState",
           "legacyStatus", "manualReviewRequired", "manualReviewReason", "submittedAt"
    FROM "SubmissionWorkflow"
    ORDER BY "recordKind", "sourceId"
  `);
  if (result.rowCount !== expectedRows.length) {
    throw new Error("Phase 5B workflow content count verification failed.");
  }

  const actualBySource = new Map(
    result.rows.map((row) => [`${row.recordKind}:${row.sourceId}`, row])
  );
  for (const expected of expectedRows) {
    const actual = actualBySource.get(`${expected.recordKind}:${expected.sourceId}`);
    if (
      !actual ||
      actual.id !== expected.id ||
      actual.submissionType !== expected.submissionType ||
      actual.qualification !== expected.qualification ||
      actual.workflowStatus !== expected.workflowStatus ||
      actual.assignedOwnerId !== expected.assignedOwnerId ||
      actual.customerSnapshotJson !== expected.customerSnapshotJson ||
      actual.privacyState !== expected.privacyState ||
      actual.legacyStatus !== expected.legacyStatus ||
      actual.manualReviewRequired !== expected.manualReviewRequired ||
      actual.manualReviewReason !== expected.manualReviewReason ||
      !sameTimestamp(actual.submittedAt, expected.submittedAt)
    ) {
      throw new Error("Phase 5B workflow content verification failed.");
    }
  }

  const missingEvents = await client.query(`
    SELECT COUNT(*)::int AS "count"
    FROM "SubmissionWorkflow" workflow
    WHERE NOT EXISTS (
      SELECT 1 FROM "WorkflowStatusEvent" event WHERE event."workflowId" = workflow."id"
    )
  `);
  if (Number(missingEvents.rows[0]?.count ?? -1) !== 0) {
    throw new Error("Phase 5B initial status event verification failed.");
  }
}

async function assertNoMissingOrOrphanedSources(client) {
  const checks = await client.query(`
    SELECT SUM("missing")::int AS "missing", SUM("orphaned")::int AS "orphaned"
    FROM (
      SELECT
        (SELECT COUNT(*) FROM "CommunityIdea" source_row LEFT JOIN "SubmissionWorkflow" workflow
          ON workflow."recordKind" = 'COMMUNITY_IDEA' AND workflow."sourceId" = source_row."id"
          WHERE workflow."id" IS NULL) AS "missing",
        (SELECT COUNT(*) FROM "SubmissionWorkflow" workflow LEFT JOIN "CommunityIdea" source_row
          ON source_row."id" = workflow."sourceId"
          WHERE workflow."recordKind" = 'COMMUNITY_IDEA' AND source_row."id" IS NULL) AS "orphaned"
      UNION ALL
      SELECT
        (SELECT COUNT(*) FROM "CustomInquiry" source_row LEFT JOIN "SubmissionWorkflow" workflow
          ON workflow."recordKind" = 'CUSTOM_INQUIRY' AND workflow."sourceId" = source_row."id"
          WHERE workflow."id" IS NULL),
        (SELECT COUNT(*) FROM "SubmissionWorkflow" workflow LEFT JOIN "CustomInquiry" source_row
          ON source_row."id" = workflow."sourceId"
          WHERE workflow."recordKind" = 'CUSTOM_INQUIRY' AND source_row."id" IS NULL)
      UNION ALL
      SELECT
        (SELECT COUNT(*) FROM "SourceRequest" source_row LEFT JOIN "SubmissionWorkflow" workflow
          ON workflow."recordKind" = 'SOURCE_REQUEST' AND workflow."sourceId" = source_row."id"
          WHERE workflow."id" IS NULL),
        (SELECT COUNT(*) FROM "SubmissionWorkflow" workflow LEFT JOIN "SourceRequest" source_row
          ON source_row."id" = workflow."sourceId"
          WHERE workflow."recordKind" = 'SOURCE_REQUEST' AND source_row."id" IS NULL)
      UNION ALL
      SELECT
        (SELECT COUNT(*) FROM "Lead" source_row LEFT JOIN "SubmissionWorkflow" workflow
          ON workflow."recordKind" = 'LEAD' AND workflow."sourceId" = source_row."id"
          WHERE workflow."id" IS NULL),
        (SELECT COUNT(*) FROM "SubmissionWorkflow" workflow LEFT JOIN "Lead" source_row
          ON source_row."id" = workflow."sourceId"
          WHERE workflow."recordKind" = 'LEAD' AND source_row."id" IS NULL)
    ) checks
  `);
  if (Number(checks.rows[0]?.missing || 0) !== 0 || Number(checks.rows[0]?.orphaned || 0) !== 0) {
    throw new Error("Phase 5B source integrity verification failed.");
  }
}

export async function backfillSubmissionWorkflows(client) {
  let transactionOpen = false;
  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    transactionOpen = true;
    await client.query("SET LOCAL statement_timeout = '60s'");
    const teamMemberIds = await loadTeamMemberIds(client);
    const counts = {};
    const expectedRows = [];
    let inserted = 0;
    for (const definition of sourceDefinitions) {
      const source = await client.query(definition.query);
      counts[definition.recordKind] = source.rowCount || 0;
      for (const row of source.rows) {
        if (!row.id || typeof row.status !== "string") {
          throw new Error("Phase 5B encountered an invalid source record.");
        }
        const expected = expectedWorkflow(definition, row, teamMemberIds);
        expectedRows.push(expected);
        if (await insertWorkflow(client, expected)) inserted += 1;
      }
    }
    await assertNoMissingOrOrphanedSources(client);
    await assertWorkflowContents(client, expectedRows);
    const totals = await client.query(`
      SELECT COUNT(*)::int AS "total",
             COUNT(*) FILTER (WHERE "manualReviewRequired")::int AS "manualReview",
             COUNT(*) FILTER (WHERE NOT "manualReviewRequired")::int AS "kpiEligible"
      FROM "SubmissionWorkflow"
    `);
    const expected = Object.values(counts).reduce((sum, value) => sum + value, 0);
    if (Number(totals.rows[0]?.total ?? -1) !== expected) {
      throw new Error("Phase 5B workflow count verification failed.");
    }
    await client.query("COMMIT");
    transactionOpen = false;
    return {
      inserted,
      total: Number(totals.rows[0].total),
      manualReview: Number(totals.rows[0].manualReview),
      kpiEligible: Number(totals.rows[0].kpiEligible),
      sourceCounts: counts
    };
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

export const phase5bSourceDefinitions = sourceDefinitions.map(({ recordKind, submissionType, table }) => ({
  recordKind,
  submissionType,
  table
}));

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import * as tls from "node:tls";

import { parseSelectedCertificateAuthorities } from "./preview-credential-readonly-check.mjs";

import {
  canonicalizeMigrationSqlForChecksum,
  createPreviewBootstrapConnectionConfig,
  PreviewBootstrapSafetyError,
  validatePreviewBootstrapEnvironment
} from "./preview-bootstrap-safety.mjs";

export const phase5bMigrationName = "20260720010000_phase_5a_submission_workflow";
export const phase5bMigrationSha256 = "52a7550c619df71a872bfff30c390666a7eedaa1671572d47737786a5be93edb";
export const phase5bReviewedMigrations = [
  { name: phase5bMigrationName, checksum: phase5bMigrationSha256 },
  { name: "20260729010000_community_discussion_foundation", checksum: "f3d11aa4ee6c2849be776eb62f705b388b6d5a994c22b0592212a3f992785d0b" },
  { name: "20260729030000_source_public_activity", checksum: "6c67d8cd4b498884faf428bd133fea728c56e3a9c64d2f77561d0b25b0de06b2" },
  { name: "20260730010000_add_community_profile_details", checksum: "71954fb9feb97ba91b1f0de16f17b9380e5f670bb3d6611ceb52ff66c0db858c" },
  { name: "20260730020000_add_source_weekly_showcase", checksum: "891fd8c554bb67d8b064e438abf97764765ec9ca220d62081fff5c777fab66f0" },
  { name: "20260801010000_add_public_disclosure_evidence", checksum: "eb228b946c71621001cbee1d370518936791965a4d7b797ed56e6c62c86e021d" }
];
export const phase5bPriorMigrations = [
  "20260712010000_add_work_order_contact_event",
  "20260712030000_add_operations_analytics_crm_v1",
  "20260716010000_phase_3b1_security_foundation",
  "20260717010000_phase_3b2_ideas_custom_workflow"
];

export class Phase5bPreviewMigrationError extends PreviewBootstrapSafetyError {
  constructor(message) {
    super(message);
    this.name = "Phase5bPreviewMigrationError";
  }
}

export function validatePhase5bPreviewTarget(environment) {
  return validatePreviewBootstrapEnvironment(environment);
}

export function assertPhase5bMigrationChecksum(sql) {
  const checksum = createHash("sha256")
    .update(canonicalizeMigrationSqlForChecksum(sql))
    .digest("hex");
  if (checksum !== phase5bMigrationSha256) {
    throw new Phase5bPreviewMigrationError("The reviewed Phase 5A migration checksum does not match.");
  }
  return checksum;
}

export function assertPhase5bReviewedMigrationChecksums(sqlByName) {
  if (!(sqlByName instanceof Map)) {
    throw new Phase5bPreviewMigrationError("Reviewed Preview migrations are unavailable.");
  }
  for (const migration of phase5bReviewedMigrations) {
    const sql = sqlByName.get(migration.name);
    if (typeof sql !== "string") {
      throw new Phase5bPreviewMigrationError("A reviewed Preview migration is missing.");
    }
    const checksum = createHash("sha256")
      .update(canonicalizeMigrationSqlForChecksum(sql))
      .digest("hex");
    if (checksum !== migration.checksum) {
      throw new Phase5bPreviewMigrationError("A reviewed Preview migration checksum does not match.");
    }
  }
  return phase5bReviewedMigrations.map(({ name }) => name);
}

export function inspectPhase5bMigrationHistory(rows) {
  if (!Array.isArray(rows)) {
    throw new Phase5bPreviewMigrationError("Preview migration history is unavailable.");
  }
  const byName = new Map();
  for (const row of rows) {
    const name = typeof row?.migration_name === "string" ? row.migration_name : "";
    if (!name || byName.has(name)) {
      throw new Phase5bPreviewMigrationError("Preview migration history is ambiguous.");
    }
    if (!row.finished_at || row.rolled_back_at || row.logs) {
      throw new Phase5bPreviewMigrationError("Preview contains an incomplete or failed migration.");
    }
    byName.set(name, row);
  }

  for (const name of phase5bPriorMigrations) {
    if (!byName.has(name)) {
      throw new Phase5bPreviewMigrationError("Preview is missing a prerequisite migration.");
    }
  }
  const allowed = new Set([
    ...phase5bPriorMigrations,
    ...phase5bReviewedMigrations.map(({ name }) => name)
  ]);
  if ([...byName.keys()].some((name) => !allowed.has(name))) {
    throw new Phase5bPreviewMigrationError("Preview migration history contains an unexpected migration.");
  }

  for (const migration of phase5bReviewedMigrations) {
    const applied = byName.get(migration.name);
    if (applied && applied.checksum !== migration.checksum) {
      throw new Phase5bPreviewMigrationError("An applied reviewed Preview migration checksum does not match.");
    }
  }
  return {
    phase5bAlreadyApplied: byName.has(phase5bMigrationName),
    pendingReviewedMigrations: phase5bReviewedMigrations
      .filter(({ name }) => !byName.has(name))
      .map(({ name }) => name)
  };
}

export async function readAndValidatePhase5bCertificate(certificatePath) {
  if (typeof certificatePath !== "string" || !certificatePath.trim() || certificatePath.startsWith("\\\\")) {
    throw new Phase5bPreviewMigrationError("The selected Preview TLS certificate is invalid.");
  }
  const bytes = await readFile(certificatePath);
  if (bytes.length === 0 || bytes.length > 16_384) {
    bytes.fill(0);
    throw new Phase5bPreviewMigrationError("The selected Preview TLS certificate is invalid.");
  }
  try {
    const certificateBase64 = bytes.toString("base64");
    parseSelectedCertificateAuthorities(certificateBase64);
    return { bytes, certificateBase64 };
  } catch (error) {
    bytes.fill(0);
    if (error instanceof Phase5bPreviewMigrationError) throw error;
    throw new Phase5bPreviewMigrationError("The selected Preview TLS certificate is invalid.");
  }
}

export function createPhase5bConnectionConfig(previewDirectUrl, certificateBase64) {
  return createPreviewBootstrapConnectionConfig(previewDirectUrl, certificateBase64);
}

export function assertPhase5bConnectedPreviewIdentity({ connectionConfig, stream, identityRow }) {
  const ssl = connectionConfig?.ssl;
  if (identityRow?.databaseName !== "postgres") {
    throw new Phase5bPreviewMigrationError("Preview database identity verification failed.");
  }
  if (
    connectionConfig?.database !== "postgres" ||
    connectionConfig?.port !== 5432 ||
    !connectionConfig?.host ||
    !ssl ||
    ssl.rejectUnauthorized !== true ||
    ssl.servername !== connectionConfig.host ||
    ssl.checkServerIdentity !== tls.checkServerIdentity ||
    !Array.isArray(ssl.ca) ||
    ssl.ca.length === 0 ||
    stream?.encrypted !== true ||
    stream?.authorized !== true
  ) {
    throw new Phase5bPreviewMigrationError("Preview database client TLS verification failed.");
  }
  return { databaseName: "postgres", tlsVerified: true };
}

export function createPhase5bPrismaUrl(previewDirectUrl, certificatePath) {
  let parsed;
  try {
    parsed = new URL(previewDirectUrl);
  } catch {
    throw new Phase5bPreviewMigrationError("The guarded Preview migration URL is invalid.");
  }
  parsed.search = "";
  parsed.searchParams.set("sslmode", "verify-full");
  parsed.searchParams.set("sslrootcert", certificatePath);
  return parsed.toString();
}

export function assertPhase5bTypedConfirmation(typedValue, previewRef) {
  if (typedValue.trim() !== `APPLY PHASE 5B ${previewRef}`) {
    throw new Phase5bPreviewMigrationError("Typed Preview confirmation does not match.");
  }
}

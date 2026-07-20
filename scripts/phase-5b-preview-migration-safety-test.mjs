import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as tls from "node:tls";
import test from "node:test";

import {
  assertPhase5bMigrationChecksum,
  assertPhase5bTypedConfirmation,
  assertPhase5bConnectedPreviewIdentity,
  createPhase5bConnectionConfig,
  createPhase5bPrismaUrl,
  inspectPhase5bMigrationHistory,
  phase5bMigrationName,
  phase5bMigrationSha256,
  phase5bPriorMigrations,
  readAndValidatePhase5bCertificate,
  validatePhase5bPreviewTarget
} from "./lib/phase-5b-preview-migration-safety.mjs";

const productionRef = "prodref12345678901234";
const previewRef = "preview1234567890123";
const fakePassword = "fake-password-only";
const fakeDirectUrl = `postgresql://postgres.${previewRef}:${fakePassword}@ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=verify-full`;
const file = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function environment(overrides = {}) {
  return {
    TYORA_PRODUCTION_PROJECT_REF: productionRef,
    TYORA_PREVIEW_PROJECT_REF: previewRef,
    PREVIEW_SUPABASE_URL: `https://${previewRef}.supabase.co`,
    PREVIEW_DIRECT_URL: fakeDirectUrl,
    ...overrides
  };
}

function completedMigration(name, checksum = "safe-checksum") {
  return {
    migration_name: name,
    checksum,
    finished_at: new Date("2026-07-20T00:00:00.000Z"),
    rolled_back_at: null,
    logs: null
  };
}

test("target guard requires distinct Preview refs, port 5432, postgres, and TLS", () => {
  const result = validatePhase5bPreviewTarget(environment());
  assert.equal(result.previewRef, previewRef);
  assert.equal(result.databaseName, "postgres");
  assert.equal(result.connectionMode, "session-pooler");
  assert.throws(
    () => validatePhase5bPreviewTarget(environment({ TYORA_PRODUCTION_PROJECT_REF: previewRef })),
    /must differ/
  );
  assert.throws(
    () => validatePhase5bPreviewTarget(environment({ PREVIEW_DIRECT_URL: fakeDirectUrl.replace(":5432/", ":6543/") })),
    /5432/
  );
  assert.throws(
    () => validatePhase5bPreviewTarget(environment({ PREVIEW_DIRECT_URL: fakeDirectUrl.replace("/postgres?", "/other?") })),
    /postgres database/
  );
});

test("the reviewed migration checksum is pinned", async () => {
  const migration = await file("prisma/migrations/20260720010000_phase_5a_submission_workflow/migration.sql");
  assert.equal(assertPhase5bMigrationChecksum(migration), phase5bMigrationSha256);
  assert.throws(() => assertPhase5bMigrationChecksum(`${migration}\n-- changed`), /checksum/);
});

test("history guard accepts only exact prerequisites and the pinned migration", () => {
  const prior = phase5bPriorMigrations.map((name) => completedMigration(name));
  assert.deepEqual(inspectPhase5bMigrationHistory(prior), { phase5bAlreadyApplied: false });
  assert.deepEqual(
    inspectPhase5bMigrationHistory([...prior, completedMigration(phase5bMigrationName, phase5bMigrationSha256)]),
    { phase5bAlreadyApplied: true }
  );
  assert.throws(() => inspectPhase5bMigrationHistory(prior.slice(1)), /prerequisite/);
  assert.throws(() => inspectPhase5bMigrationHistory([...prior, completedMigration("unexpected")]), /unexpected/);
  assert.throws(
    () => inspectPhase5bMigrationHistory([...prior, completedMigration(phase5bMigrationName, "wrong")]),
    /checksum/
  );
  assert.throws(
    () => inspectPhase5bMigrationHistory([...prior.slice(0, 3), { ...prior[3], finished_at: null }]),
    /incomplete or failed/
  );
});

test("selected CA is parsed locally and used with verified TLS/SNI", async () => {
  const directory = await mkdtemp(join(tmpdir(), "tyora-phase5b-test-"));
  const certificatePath = join(directory, "prod-ca-2021 (1).crt");
  const crlfPem = tls.rootCertificates[0].replace(/\r?\n/g, "\r\n");
  await writeFile(
    certificatePath,
    Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(crlfPem, "utf8")])
  );
  let data;
  try {
    data = await readAndValidatePhase5bCertificate(certificatePath);
    const config = createPhase5bConnectionConfig(fakeDirectUrl, data.certificateBase64);
    assert.equal(config.host, "ap-northeast-1.pooler.supabase.com");
    assert.equal(config.port, 5432);
    assert.equal(config.database, "postgres");
    assert.equal(config.ssl.rejectUnauthorized, true);
    assert.equal(config.ssl.servername, config.host);
    assert.equal(config.sslnegotiation, "postgres");
  } finally {
    if (data?.bytes) data.bytes.fill(0);
    await rm(directory, { recursive: true, force: true });
  }
});

test("connected Preview identity uses verified client TLS rather than pooler backend pg_stat_ssl", () => {
  const certificateBase64 = Buffer.from(tls.rootCertificates[0], "utf8").toString("base64");
  const connectionConfig = createPhase5bConnectionConfig(fakeDirectUrl, certificateBase64);
  assert.deepEqual(
    assertPhase5bConnectedPreviewIdentity({
      connectionConfig,
      stream: { encrypted: true, authorized: true },
      identityRow: { databaseName: "postgres" }
    }),
    { databaseName: "postgres", tlsVerified: true }
  );
  assert.throws(
    () => assertPhase5bConnectedPreviewIdentity({
      connectionConfig,
      stream: { encrypted: true, authorized: false },
      identityRow: { databaseName: "postgres" }
    }),
    /client TLS verification failed/
  );
  assert.throws(
    () => assertPhase5bConnectedPreviewIdentity({
      connectionConfig,
      stream: { encrypted: true, authorized: true },
      identityRow: { databaseName: "production" }
    }),
    /identity verification failed/
  );
});

test("Prisma migrate URL retains Preview target and forces CA verification", () => {
  const url = new URL(createPhase5bPrismaUrl(fakeDirectUrl, "C:\\safe-fake\\preview-ca.pem"));
  assert.equal(url.hostname, "ap-northeast-1.pooler.supabase.com");
  assert.equal(url.port, "5432");
  assert.equal(url.pathname, "/postgres");
  assert.equal(url.searchParams.get("sslmode"), "verify-full");
  assert.equal(url.searchParams.get("sslrootcert"), "C:\\safe-fake\\preview-ca.pem");
});

test("apply requires an exact typed Preview confirmation", () => {
  assert.doesNotThrow(() => assertPhase5bTypedConfirmation(`APPLY PHASE 5B ${previewRef}`, previewRef));
  assert.throws(() => assertPhase5bTypedConfirmation(previewRef, previewRef), /does not match/);
  assert.throws(() => assertPhase5bTypedConfirmation(`APPLY PHASE 5B ${productionRef}`, previewRef), /does not match/);
});

test("runner uses migrate deploy only and keeps output redacted", async () => {
  const [runner, backfill] = await Promise.all([
    file("scripts/phase-5b-preview-migration.mjs"),
    file("scripts/lib/phase-5b-backfill.mjs")
  ]);
  assert.match(runner, /\[prismaExecutable, "migrate", "deploy"\]/);
  assert.match(runner, /stdio:\s*\["ignore", "pipe", "pipe"\]/);
  assert.match(runner, /captured\.length = 0/);
  assert.match(runner, /chunk\.fill\(0\)/);
  assert.match(runner, /const immediateIdentity = validatePhase5bPreviewTarget\(targetEnvironment\)/);
  assert.match(runner, /const immediateCertificate = await readAndValidatePhase5bCertificate\(certificatePath\)/);
  assert.match(runner, /assertPhase5bConnectedPreviewIdentity/);
  assert.doesNotMatch(runner, /pg_stat_ssl/);
  assert.match(runner, /assertPhase5bMigrationChecksum\(await readFile\(migrationPath, "utf8"\)\)/);
  assert.doesNotMatch(runner, /console\.(log|error)\([^\n]*(directUrl|prismaUrl|password|certificatePath)/);
  assert.doesNotMatch(runner, /db\s+push|migrate\s+dev|migrate\s+reset|seed|cleanup/i);
  assert.match(backfill, /BEGIN ISOLATION LEVEL SERIALIZABLE/);
  assert.match(backfill, /ON CONFLICT \("recordKind", "sourceId"\) DO NOTHING/);
  assert.match(backfill, /assertWorkflowContents\(client, expectedRows\)/);
  assert.match(backfill, /actual\.privacyState !== expected\.privacyState/);
  assert.match(backfill, /actual\.legacyStatus !== expected\.legacyStatus/);
  assert.match(backfill, /actual\.manualReviewRequired !== expected\.manualReviewRequired/);
  assert.match(backfill, /sameTimestamp\(actual\.submittedAt, expected\.submittedAt\)/);
  assert.match(backfill, /initial status event verification failed/);
  assert.doesNotMatch(backfill, /UPDATE\s+"(CommunityIdea|CustomInquiry|SourceRequest|Lead)"/i);
});

test("GUI keeps secrets masked and reuses the read-only certificate loader", async () => {
  const [gui, consoleWrapper, certificateLoader, certificateValidator, certificateParserTest, safety] = await Promise.all([
    file("scripts/phase-5b-preview-migration.ps1"),
    file("scripts/phase-5b-preview-migration-console.ps1"),
    file("scripts/lib/phase-5b-certificate-validator.psm1"),
    file("scripts/phase-5b-certificate-validator.mjs"),
    file("scripts/phase-5b-certificate-parser-test.ps1"),
    file("scripts/lib/phase-5b-preview-migration-safety.mjs")
  ]);
  assert.match(gui, /UseSystemPasswordChar = \$true/g);
  assert.match(gui, /Test-TyoraPreviewTarget/);
  assert.match(gui, /EscapeDataString\(\$passwordValue\)/);
  assert.match(gui, /PREVIEW_SSL_CA_PATH/);
  assert.match(gui, /phase-5b-certificate-validator\.psm1/);
  assert.doesNotMatch(gui, /-ArgumentList[^\n]*(Password|DirectUrl|CertificatePath)/i);
  assert.match(consoleWrapper, /phase-5b-preview-migration\.mjs/);
  assert.doesNotMatch(consoleWrapper, /Write-(Host|Output)[^\n]*\$env:/i);
  assert.match(certificateLoader, /@\('\.crt', '\.cer', '\.pem'\)/);
  assert.match(certificateLoader, /ReadAllBytes/);
  assert.match(certificateLoader, /RedirectStandardInput = \$true/);
  assert.match(certificateLoader, /phase-5b-certificate-validator\.mjs/);
  assert.doesNotMatch(certificateLoader, /X509Certificate2|CreateFromPem/);
  assert.match(certificateValidator, /parseSelectedCertificateAuthorities/);
  assert.doesNotMatch(certificateValidator, /fetch\(|https?:\/\//);
  assert.match(safety, /parseSelectedCertificateAuthorities\(certificateBase64\)/);
  assert.match(certificateParserTest, /prod-ca-2021 \(1\)\.crt/);
  assert.match(certificateParserTest, /utf8-lf\.pem/);
  assert.match(certificateParserTest, /binary\.cer/);
});

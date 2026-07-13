import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assertExpectedBaselineFingerprint,
  assertTypedPreviewConfirmation,
  canonicalizeMigrationSqlForChecksum,
  parsePreviewBootstrapArguments,
  validatePreviewBootstrapEnvironment
} from "./lib/preview-bootstrap-safety.mjs";

const productionRef = "prodref12345678901234";
const previewRef = "preview1234567890123";

function validEnvironment(overrides = {}) {
  return {
    TYORA_PRODUCTION_PROJECT_REF: productionRef,
    TYORA_PREVIEW_PROJECT_REF: previewRef,
    PREVIEW_SUPABASE_URL: `https://${previewRef}.supabase.co`,
    PREVIEW_DIRECT_URL: `postgresql://postgres:password@db.${previewRef}.supabase.co:5432/postgres?sslmode=require`,
    ...overrides
  };
}

test("all four Preview identity variables are required", () => {
  for (const name of [
    "TYORA_PRODUCTION_PROJECT_REF",
    "TYORA_PREVIEW_PROJECT_REF",
    "PREVIEW_SUPABASE_URL",
    "PREVIEW_DIRECT_URL"
  ]) {
    const environment = validEnvironment();
    delete environment[name];
    assert.throws(() => validatePreviewBootstrapEnvironment(environment), new RegExp(name));
  }
});

test("a direct Preview connection on port 5432 is accepted without returning credentials", () => {
  const result = validatePreviewBootstrapEnvironment(validEnvironment());
  assert.deepEqual(result, {
    productionRef,
    previewRef,
    supabaseHost: `${previewRef}.supabase.co`,
    databaseHost: `db.${previewRef}.supabase.co`,
    connectionMode: "direct",
    databaseName: "postgres"
  });
  assert.equal(JSON.stringify(result).includes("password"), false);
});

test("the Preview direct URL must carry its own password", () => {
  assert.throws(
    () =>
      validatePreviewBootstrapEnvironment(
        validEnvironment({
          PREVIEW_DIRECT_URL: `postgresql://postgres@db.${previewRef}.supabase.co:5432/postgres?sslmode=require`
        })
      ),
    /password/i
  );
});

test("a session pooler connection is accepted only when its username identifies Preview", () => {
  const environment = validEnvironment({
    PREVIEW_DIRECT_URL: `postgresql://postgres.${previewRef}:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`
  });
  assert.equal(validatePreviewBootstrapEnvironment(environment).connectionMode, "session-pooler");

  environment.PREVIEW_DIRECT_URL =
    "postgresql://postgres.unrelatedref123456789:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres";
  assert.throws(() => validatePreviewBootstrapEnvironment(environment), /Preview project ref/i);
});

test("Production and Preview refs must differ", () => {
  assert.throws(
    () =>
      validatePreviewBootstrapEnvironment(
        validEnvironment({ TYORA_PREVIEW_PROJECT_REF: productionRef })
      ),
    /must differ/i
  );
});

test("both Preview URLs must identify Preview and exclude Production", () => {
  assert.throws(
    () =>
      validatePreviewBootstrapEnvironment(
        validEnvironment({ PREVIEW_SUPABASE_URL: `https://${productionRef}.supabase.co` })
      ),
    /Preview project ref/i
  );
  assert.throws(
    () =>
      validatePreviewBootstrapEnvironment(
        validEnvironment({
          PREVIEW_DIRECT_URL: `postgresql://postgres:password@db.${productionRef}.supabase.co:5432/postgres`
        })
      ),
    /Preview project ref/i
  );
});

test("transaction pooler port 6543 and implicit ports are rejected", () => {
  assert.throws(
    () =>
      validatePreviewBootstrapEnvironment(
        validEnvironment({
          PREVIEW_DIRECT_URL: `postgresql://postgres.${previewRef}:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
        })
      ),
    /5432/
  );
  assert.throws(
    () =>
      validatePreviewBootstrapEnvironment(
        validEnvironment({
          PREVIEW_DIRECT_URL: `postgresql://postgres:password@db.${previewRef}.supabase.co/postgres`
        })
      ),
    /5432/
  );
});

test("the connection cannot redirect Prisma away from the public schema or postgres database", () => {
  assert.throws(
    () =>
      validatePreviewBootstrapEnvironment(
        validEnvironment({
          PREVIEW_DIRECT_URL: `postgresql://postgres:password@db.${previewRef}.supabase.co:5432/postgres?schema=private`
        })
      ),
    /only sslmode/i
  );
  assert.throws(
    () =>
      validatePreviewBootstrapEnvironment(
        validEnvironment({
          PREVIEW_DIRECT_URL: `postgresql://postgres:password@db.${previewRef}.supabase.co:5432/another_database`
        })
      ),
    /postgres database/i
  );
  assert.throws(
    () =>
      validatePreviewBootstrapEnvironment(
        validEnvironment({
          PREVIEW_DIRECT_URL: `postgresql://postgres:password@db.${previewRef}.supabase.co:5432/postgres?options=-csearch_path%3Dprivate`
        })
      ),
    /only sslmode/i
  );
});

test("PostgreSQL query parameters cannot override connection identity", () => {
  for (const override of [
    "host=db.attacker.invalid",
    "h%6fst=db.attacker.invalid",
    "port=6543",
    "user=postgres.otherprojectref123",
    "password=other",
    "sslcert=C%3A%5Csecret.pem",
    "sslkey=C%3A%5Csecret.key",
    "service=production"
  ]) {
    assert.throws(
      () =>
        validatePreviewBootstrapEnvironment(
          validEnvironment({
            PREVIEW_DIRECT_URL: `postgresql://postgres:password@db.${previewRef}.supabase.co:5432/postgres?sslmode=require&${override}`
          })
        ),
      /only sslmode/i
    );
  }
});

test("the Preview migration connection must explicitly require TLS", () => {
  assert.throws(
    () =>
      validatePreviewBootstrapEnvironment(
        validEnvironment({
          PREVIEW_DIRECT_URL: `postgresql://postgres:password@db.${previewRef}.supabase.co:5432/postgres`
        })
      ),
    /TLS/i
  );
  assert.throws(
    () =>
      validatePreviewBootstrapEnvironment(
        validEnvironment({
          PREVIEW_DIRECT_URL: `postgresql://postgres:password@db.${previewRef}.supabase.co:5432/postgres?sslmode=disable`
        })
      ),
    /TLS/i
  );
});

test("bootstrap defaults to dry-run and accepts only an explicit apply flag", () => {
  const fingerprint = "a".repeat(64);
  assert.deepEqual(parsePreviewBootstrapArguments([]), {
    apply: false,
    expectedFingerprint: null
  });
  assert.deepEqual(
    parsePreviewBootstrapArguments(["--apply", "--fingerprint", fingerprint]),
    { apply: true, expectedFingerprint: fingerprint }
  );
  assert.throws(() => parsePreviewBootstrapArguments(["--apply"]), /fingerprint/i);
  assert.throws(() => parsePreviewBootstrapArguments(["--force"]), /--apply/);
  assert.throws(
    () => parsePreviewBootstrapArguments(["--apply", "--fingerprint", "short"]),
    /fingerprint/i
  );
});

test("apply confirmation must exactly match the Preview project ref", () => {
  assert.doesNotThrow(() => assertTypedPreviewConfirmation(previewRef, previewRef));
  assert.throws(() => assertTypedPreviewConfirmation("preview", previewRef), /does not match/i);
});

test("apply must match the complete dry-run baseline fingerprint", () => {
  const fingerprint = "b".repeat(64);
  assert.doesNotThrow(() => assertExpectedBaselineFingerprint(fingerprint, fingerprint));
  assert.throws(
    () => assertExpectedBaselineFingerprint("c".repeat(64), fingerprint),
    /fingerprint/i
  );
});

test("migration checksums use canonical LF line endings", () => {
  assert.equal(
    canonicalizeMigrationSqlForChecksum("CREATE TABLE one;\r\nCREATE TABLE two;\r"),
    "CREATE TABLE one;\nCREATE TABLE two;\n"
  );
});

test("CLI source is fail-closed, read-only by default, and contains no unsafe fallback", async () => {
  const source = await readFile(new URL("./bootstrap-preview-db.mjs", import.meta.url), "utf8");
  assert.match(source, /PREVIEW_DIRECT_URL/);
  assert.match(source, /BEGIN READ ONLY/);
  assert.match(source, /pg_catalog\.pg_proc/);
  assert.match(source, /pg_catalog\.pg_type/);
  assert.match(source, /--apply/);
  assert.match(source, /assertDatabaseIsEmpty/);
  assert.match(source, /readdir/);
  assert.match(source, /CREATE TABLE "_prisma_migrations"/);
  assert.match(source, /canonicalizeMigrationSqlForChecksum/);
  assert.match(source, /assertExpectedBaselineFingerprint/);
  assert.doesNotMatch(source, /\.\.\.process\.env/);
  assert.doesNotMatch(source, /process\.env\.DATABASE_URL/);
  assert.doesNotMatch(source, /(?:from|import)\s+["']dotenv/i);
  assert.doesNotMatch(source, /migrate["',\s]+deploy/i);
  assert.doesNotMatch(source, /migrate["',\s]+resolve/i);
  assert.doesNotMatch(source, /db["',\s]+push/i);
  assert.doesNotMatch(source, /seed/i);
});

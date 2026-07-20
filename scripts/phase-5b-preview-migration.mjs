#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import process from "node:process";
import pg from "pg";

import { backfillSubmissionWorkflows } from "./lib/phase-5b-backfill.mjs";
import {
  assertPhase5bMigrationChecksum,
  assertPhase5bTypedConfirmation,
  createPhase5bConnectionConfig,
  createPhase5bPrismaUrl,
  inspectPhase5bMigrationHistory,
  phase5bMigrationName,
  phase5bMigrationSha256,
  Phase5bPreviewMigrationError,
  readAndValidatePhase5bCertificate,
  validatePhase5bPreviewTarget
} from "./lib/phase-5b-preview-migration-safety.mjs";

const { Client } = pg;
const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const prismaExecutable = resolve(repositoryRoot, "node_modules", "prisma", "build", "index.js");
const migrationPath = resolve(
  repositoryRoot,
  "prisma",
  "migrations",
  phase5bMigrationName,
  "migration.sql"
);

function childEnvironment(databaseUrl) {
  const environment = {
    DATABASE_URL: databaseUrl,
    DOTENV_CONFIG_PATH: resolve(repositoryRoot, ".env.phase5b-disabled"),
    DOTENV_CONFIG_QUIET: "true",
    NO_COLOR: "1"
  };
  for (const name of [
    "SystemRoot", "WINDIR", "TEMP", "TMP", "TMPDIR", "HOME", "USERPROFILE",
    "LOCALAPPDATA", "APPDATA", "PATH", "Path", "PATHEXT", "COMSPEC", "LANG", "LC_ALL"
  ]) {
    if (process.env[name]) environment[name] = process.env[name];
  }
  return environment;
}

function runPrismaMigrateDeploy(databaseUrl) {
  return new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(process.execPath, [prismaExecutable, "migrate", "deploy"], {
      cwd: repositoryRoot,
      env: childEnvironment(databaseUrl),
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const captured = [];
    let capturedBytes = 0;
    let settled = false;
    const clearCaptured = () => {
      for (const chunk of captured) chunk.fill(0);
      captured.length = 0;
      capturedBytes = 0;
    };
    const capture = (chunk) => {
      if (capturedBytes >= 256_000) return;
      captured.push(chunk);
      capturedBytes += chunk.length;
    };
    child.stdout.on("data", capture);
    child.stderr.on("data", capture);
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      clearCaptured();
      rejectCommand(new Phase5bPreviewMigrationError("Prisma migrate deploy timed out."));
    }, 180_000);
    child.on("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearCaptured();
      rejectCommand(new Phase5bPreviewMigrationError("Prisma migrate deploy could not start."));
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearCaptured();
      if (code !== 0) {
        rejectCommand(new Phase5bPreviewMigrationError("Prisma migrate deploy failed safely."));
        return;
      }
      resolveCommand();
    });
  });
}

async function readOnlyPreviewEvidence(connectionConfig) {
  const client = new Client({
    ...connectionConfig,
    connectionTimeoutMillis: 10_000,
    query_timeout: 10_000,
    statement_timeout: 10_000
  });
  let transactionOpen = false;
  try {
    await client.connect();
    await client.query("BEGIN READ ONLY");
    transactionOpen = true;
    const identity = await client.query(`
      SELECT current_database() AS "databaseName",
             EXISTS (
               SELECT 1 FROM pg_stat_ssl WHERE pid = pg_backend_pid() AND ssl = true
             ) AS "tlsEnabled"
    `);
    if (identity.rows[0]?.databaseName !== "postgres" || identity.rows[0]?.tlsEnabled !== true) {
      throw new Phase5bPreviewMigrationError("Preview database identity or TLS verification failed.");
    }
    const history = await client.query(`
      SELECT "migration_name", "checksum", "finished_at", "rolled_back_at", "logs"
      FROM "_prisma_migrations"
      ORDER BY "migration_name"
    `);
    const migrationState = inspectPhase5bMigrationHistory(history.rows);
    await client.query("ROLLBACK");
    transactionOpen = false;
    return migrationState;
  } catch (error) {
    if (error instanceof Phase5bPreviewMigrationError) throw error;
    throw new Phase5bPreviewMigrationError("The read-only Preview isolation check failed.");
  } finally {
    if (transactionOpen) await client.query("ROLLBACK").catch(() => undefined);
    await client.end().catch(() => undefined);
  }
}

async function verifyAppliedMigration(connectionConfig) {
  const client = new Client({
    ...connectionConfig,
    connectionTimeoutMillis: 10_000,
    query_timeout: 10_000,
    statement_timeout: 10_000
  });
  try {
    await client.connect();
    await client.query("BEGIN READ ONLY");
    const result = await client.query(`
      SELECT "checksum", "finished_at", "rolled_back_at", "logs"
      FROM "_prisma_migrations"
      WHERE "migration_name" = $1
    `, [phase5bMigrationName]);
    await client.query("ROLLBACK");
    if (
      result.rowCount !== 1 ||
      result.rows[0].checksum !== phase5bMigrationSha256 ||
      !result.rows[0].finished_at ||
      result.rows[0].rolled_back_at ||
      result.rows[0].logs
    ) {
      throw new Phase5bPreviewMigrationError("Phase 5A migration verification failed.");
    }
  } catch (error) {
    if (error instanceof Phase5bPreviewMigrationError) throw error;
    throw new Phase5bPreviewMigrationError("Phase 5A migration verification failed.");
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function runBackfill(connectionConfig) {
  const client = new Client({
    ...connectionConfig,
    connectionTimeoutMillis: 10_000,
    query_timeout: 60_000,
    statement_timeout: 60_000
  });
  try {
    await client.connect();
    return await backfillSubmissionWorkflows(client);
  } catch {
    throw new Phase5bPreviewMigrationError("The guarded Preview backfill failed safely.");
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function typedConfirmation(previewRef) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Phase5bPreviewMigrationError("Phase 5B apply requires an interactive terminal.");
  }
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const typed = await terminal.question(`Type APPLY PHASE 5B followed by the Preview project ref: `);
    assertPhase5bTypedConfirmation(typed, previewRef);
  } finally {
    terminal.close();
  }
}

async function main() {
  let directUrl = process.env.PREVIEW_DIRECT_URL;
  let certificatePath = process.env.PREVIEW_SSL_CA_PATH;
  let targetEnvironment;
  let certificateData;
  let connectionConfig;
  let prismaUrl;
  try {
    if (process.argv.length !== 3 || process.argv[2] !== "--apply") {
      throw new Phase5bPreviewMigrationError("Phase 5B migration requires the explicit --apply flag.");
    }
    if (!directUrl || !certificatePath) {
      throw new Phase5bPreviewMigrationError("Guarded Preview credentials are missing.");
    }
    targetEnvironment = {
      TYORA_PRODUCTION_PROJECT_REF: process.env.TYORA_PRODUCTION_PROJECT_REF,
      TYORA_PREVIEW_PROJECT_REF: process.env.TYORA_PREVIEW_PROJECT_REF,
      PREVIEW_SUPABASE_URL: process.env.PREVIEW_SUPABASE_URL,
      PREVIEW_DIRECT_URL: directUrl
    };
    const identity = validatePhase5bPreviewTarget(targetEnvironment);
    for (const name of [
      "TYORA_PRODUCTION_PROJECT_REF",
      "TYORA_PREVIEW_PROJECT_REF",
      "PREVIEW_SUPABASE_URL",
      "PREVIEW_DIRECT_URL",
      "PREVIEW_SSL_CA_PATH"
    ]) delete process.env[name];

    const sql = await readFile(migrationPath, "utf8");
    assertPhase5bMigrationChecksum(sql);
    certificateData = await readAndValidatePhase5bCertificate(certificatePath);
    connectionConfig = createPhase5bConnectionConfig(directUrl, certificateData.certificateBase64);

    const initialState = await readOnlyPreviewEvidence(connectionConfig);
    console.log("phase5b_isolation_check_pass");
    console.log("phase5b_tls_certificate_check_pass");
    console.log("phase5b_migration_checksum_check_pass");
    await typedConfirmation(identity.previewRef);

    const immediateIdentity = validatePhase5bPreviewTarget(targetEnvironment);
    if (immediateIdentity.previewRef !== identity.previewRef) {
      throw new Phase5bPreviewMigrationError("Preview target identity changed during confirmation.");
    }
    assertPhase5bMigrationChecksum(await readFile(migrationPath, "utf8"));
    const immediateCertificate = await readAndValidatePhase5bCertificate(certificatePath);
    try {
      if (immediateCertificate.certificateBase64 !== certificateData.certificateBase64) {
        throw new Phase5bPreviewMigrationError("Preview TLS certificate changed during confirmation.");
      }
    } finally {
      immediateCertificate.bytes.fill(0);
    }
    connectionConfig = createPhase5bConnectionConfig(directUrl, certificateData.certificateBase64);
    prismaUrl = createPhase5bPrismaUrl(directUrl, certificatePath);
    const immediateState = await readOnlyPreviewEvidence(connectionConfig);
    if (initialState.phase5bAlreadyApplied !== immediateState.phase5bAlreadyApplied) {
      throw new Phase5bPreviewMigrationError("Preview migration state changed during confirmation.");
    }
    if (!immediateState.phase5bAlreadyApplied) {
      await runPrismaMigrateDeploy(prismaUrl);
      console.log("phase5b_prisma_migrate_deploy_complete");
    } else {
      console.log("phase5b_prisma_migrate_deploy_already_applied");
    }
    await verifyAppliedMigration(connectionConfig);
    const backfill = await runBackfill(connectionConfig);
    console.log("phase5b_backfill_complete");
    console.log(`phase5b_workflow_total=${backfill.total}`);
    console.log(`phase5b_manual_review_total=${backfill.manualReview}`);
    console.log(`phase5b_kpi_eligible_total=${backfill.kpiEligible}`);
    console.log("phase5b_migration_complete");
  } finally {
    for (const name of [
      "TYORA_PRODUCTION_PROJECT_REF",
      "TYORA_PREVIEW_PROJECT_REF",
      "PREVIEW_SUPABASE_URL",
      "PREVIEW_DIRECT_URL",
      "PREVIEW_SSL_CA_PATH"
    ]) delete process.env[name];
    directUrl = null;
    certificatePath = null;
    targetEnvironment = null;
    prismaUrl = null;
    if (certificateData?.bytes) certificateData.bytes.fill(0);
    certificateData = null;
    if (connectionConfig) {
      connectionConfig.password = "";
      connectionConfig.ssl.ca = [];
    }
    connectionConfig = null;
  }
}

main().catch((error) => {
  const message = error instanceof Phase5bPreviewMigrationError
    ? error.message
    : "Phase 5B Preview migration stopped safely.";
  console.error(message);
  process.exitCode = 1;
});

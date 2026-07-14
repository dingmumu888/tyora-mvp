#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import process from "node:process";
import pg from "pg";

import {
  assertExpectedBaselineFingerprint,
  assertTypedPreviewConfirmation,
  canonicalizeMigrationSqlForChecksum,
  createPreviewBootstrapConnectionConfig,
  parsePreviewBootstrapArguments,
  PreviewBootstrapSafetyError,
  validatePreviewBootstrapEnvironment
} from "./lib/preview-bootstrap-safety.mjs";

const { Client } = pg;
const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const prismaExecutable = resolve(repositoryRoot, "node_modules", "prisma", "build", "index.js");
const migrationsDirectory = resolve(repositoryRoot, "prisma", "migrations");

function previewChildEnvironment(previewDirectUrl) {
  const environment = {
    DATABASE_URL: previewDirectUrl,
    DOTENV_CONFIG_PATH: resolve(repositoryRoot, ".env.bootstrap-disabled"),
    DOTENV_CONFIG_QUIET: "true"
  };
  for (const name of [
    "SystemRoot",
    "WINDIR",
    "TEMP",
    "TMP",
    "TMPDIR",
    "HOME",
    "USERPROFILE",
    "LOCALAPPDATA",
    "APPDATA",
    "PATH",
    "Path",
    "PATHEXT",
    "COMSPEC",
    "LANG",
    "LC_ALL",
    "TERM",
    "CI",
    "NO_COLOR"
  ]) {
    const value = process.env[name];
    if (value) environment[name] = value;
  }
  return environment;
}

function runPrisma(argumentsList, previewDirectUrl, input) {
  return new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(process.execPath, [prismaExecutable, ...argumentsList], {
      cwd: repositoryRoot,
      env: previewChildEnvironment(previewDirectUrl),
      shell: false,
      stdio: ["pipe", "pipe", "pipe"]
    });
    const stdout = [];
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      rejectCommand(new PreviewBootstrapSafetyError("A guarded Prisma command timed out."));
    }, 120_000);
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", () => undefined);
    child.on("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      rejectCommand(new PreviewBootstrapSafetyError("Prisma could not start."));
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code !== 0) {
        rejectCommand(new PreviewBootstrapSafetyError("A guarded Prisma command failed."));
        return;
      }
      resolveCommand(Buffer.concat(stdout).toString("utf8"));
    });
    if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

async function assertDatabaseIsEmpty(connectionConfig) {
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
    const result = await client.query(`
      SELECT (
        SELECT COUNT(*)
        FROM pg_catalog.pg_class AS item
        JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = item.relnamespace
        WHERE namespace.nspname = 'public'
          AND item.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
      ) + (
        SELECT COUNT(*)
        FROM pg_catalog.pg_proc AS item
        JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = item.pronamespace
        WHERE namespace.nspname = 'public'
      ) + (
        SELECT COUNT(*)
        FROM pg_catalog.pg_type AS item
        JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = item.typnamespace
        WHERE namespace.nspname = 'public'
      ) AS object_count
    `);
    if (Number(result.rows[0]?.object_count ?? -1) !== 0) {
      throw new PreviewBootstrapSafetyError("The Preview public schema is not empty.");
    }
    await client.query("ROLLBACK");
    transactionOpen = false;
  } catch (error) {
    if (error instanceof PreviewBootstrapSafetyError) throw error;
    throw new PreviewBootstrapSafetyError("The read-only Preview database check failed.");
  } finally {
    if (transactionOpen) {
      await client.query("ROLLBACK").catch(() => undefined);
    }
    await client.end().catch(() => undefined);
  }
}

async function listMigrationHistory() {
  const entries = await readdir(migrationsDirectory, { withFileTypes: true }).catch(() => []);
  const names = entries
    .filter((entry) => entry.isDirectory() && /^\d{14}_[a-z0-9_]+$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (names.length === 0) {
    throw new PreviewBootstrapSafetyError("No Prisma migration history was found.");
  }
  const history = [];
  for (const migrationName of names) {
    const migrationPath = resolve(migrationsDirectory, migrationName, "migration.sql");
    await access(migrationPath).catch(() => {
      throw new PreviewBootstrapSafetyError("A Prisma migration directory is incomplete.");
    });
    const content = canonicalizeMigrationSqlForChecksum(
      await readFile(migrationPath, "utf8")
    );
    history.push({
      migrationName,
      checksum: createHash("sha256").update(content).digest("hex")
    });
  }
  return history;
}

async function createCurrentSchemaSql(previewDirectUrl) {
  const sql = await runPrisma(
    ["migrate", "diff", "--from-empty", "--to-schema", "prisma/schema.prisma", "--script"],
    previewDirectUrl
  );
  if (!sql.trim()) {
    throw new PreviewBootstrapSafetyError("Prisma produced an empty schema baseline.");
  }
  return canonicalizeMigrationSqlForChecksum(sql);
}

function createBaselineFingerprint(sql, migrationHistory) {
  return createHash("sha256")
    .update("schema\0")
    .update(sql)
    .update("\0migration-history\0")
    .update(JSON.stringify(migrationHistory))
    .digest("hex");
}

async function applyCurrentSchema(sql, connectionConfig, migrationHistory) {
  const client = new Client({
    ...connectionConfig,
    connectionTimeoutMillis: 10_000,
    query_timeout: 120_000,
    statement_timeout: 120_000
  });
  let transactionOpen = false;
  try {
    await client.connect();
    await client.query("BEGIN");
    transactionOpen = true;
    const count = await client.query(`
      SELECT (
        SELECT COUNT(*) FROM pg_catalog.pg_class AS item
        JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = item.relnamespace
        WHERE namespace.nspname = 'public' AND item.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
      ) + (
        SELECT COUNT(*) FROM pg_catalog.pg_proc AS item
        JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = item.pronamespace
        WHERE namespace.nspname = 'public'
      ) + (
        SELECT COUNT(*) FROM pg_catalog.pg_type AS item
        JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = item.typnamespace
        WHERE namespace.nspname = 'public'
      ) AS object_count
    `);
    if (Number(count.rows[0]?.object_count ?? -1) !== 0) {
      throw new PreviewBootstrapSafetyError("The Preview public schema is not empty.");
    }

    await client.query(sql);
    await client.query(`
      CREATE TABLE "_prisma_migrations" (
        "id" VARCHAR(36) PRIMARY KEY NOT NULL,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      )
    `);
    for (const migration of migrationHistory) {
      await client.query(
        `INSERT INTO "_prisma_migrations"
          ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
         VALUES ($1, $2, now(), $3, now(), 0)`,
        [randomUUID(), migration.checksum, migration.migrationName]
      );
    }
    await client.query("COMMIT");
    transactionOpen = false;
  } catch (error) {
    if (error instanceof PreviewBootstrapSafetyError) throw error;
    throw new PreviewBootstrapSafetyError("Atomic Preview schema initialization failed.");
  } finally {
    if (transactionOpen) {
      await client.query("ROLLBACK").catch(() => undefined);
    }
    await client.end().catch(() => undefined);
  }
}

async function requestTypedConfirmation(previewRef) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new PreviewBootstrapSafetyError("Apply mode requires an interactive terminal.");
  }
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const typedValue = await terminal.question("Type the Preview project ref to authorize initialization: ");
    assertTypedPreviewConfirmation(typedValue, previewRef);
  } finally {
    terminal.close();
  }
}

async function main() {
  let previewDirectUrl;
  let certificateBase64;
  let connectionConfig;
  try {
    const options = parsePreviewBootstrapArguments(process.argv.slice(2));
    const identity = validatePreviewBootstrapEnvironment(process.env);
    previewDirectUrl = process.env.PREVIEW_DIRECT_URL;
    certificateBase64 = process.env.PREVIEW_SSL_CA_BASE64;
    if (!previewDirectUrl) {
      throw new PreviewBootstrapSafetyError("PREVIEW_DIRECT_URL is required.");
    }
    if (!certificateBase64) {
      throw new PreviewBootstrapSafetyError(
        "PREVIEW_SSL_CA_BASE64 is required for verified TLS."
      );
    }
    connectionConfig = createPreviewBootstrapConnectionConfig(
      previewDirectUrl,
      certificateBase64
    );
    delete process.env.PREVIEW_DIRECT_URL;
    delete process.env.PREVIEW_SSL_CA_BASE64;
    certificateBase64 = null;

    await assertDatabaseIsEmpty(connectionConfig);
    const migrationHistory = await listMigrationHistory();
    const sql = await createCurrentSchemaSql(previewDirectUrl);
    const fingerprint = createBaselineFingerprint(sql, migrationHistory);
    console.log(
      `Preview safety checks passed for project ...${identity.previewRef.slice(-6)} (${identity.connectionMode}, port 5432).`
    );
    console.log(
      `Schema baseline prepared in memory (${Buffer.byteLength(sql)} bytes, ${migrationHistory.length} history entries).`
    );
    console.log(`Reviewed baseline fingerprint: ${fingerprint}`);

    if (!options.apply) {
      console.log(
        "Dry-run complete. No database changes were made. Apply only after approval with --apply --fingerprint followed by the fingerprint above."
      );
      return;
    }

    assertExpectedBaselineFingerprint(fingerprint, options.expectedFingerprint);
    await requestTypedConfirmation(identity.previewRef);
    await applyCurrentSchema(sql, connectionConfig, migrationHistory);
    console.log("Preview schema initialization completed.");
  } finally {
    delete process.env.PREVIEW_DIRECT_URL;
    delete process.env.PREVIEW_SSL_CA_BASE64;
    certificateBase64 = null;
    previewDirectUrl = null;
    if (connectionConfig) {
      connectionConfig.password = "";
      connectionConfig.ssl.ca = [];
    }
    connectionConfig = null;
  }
}

main().catch((error) => {
  const message =
    error instanceof PreviewBootstrapSafetyError
      ? error.message
      : "Preview schema initialization stopped safely.";
  console.error(message);
  process.exitCode = 1;
});

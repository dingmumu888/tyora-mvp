import assert from "node:assert/strict";
import { X509Certificate } from "node:crypto";
import { readFile } from "node:fs/promises";
import * as tls from "node:tls";
import test from "node:test";
import pg from "pg";

import {
  buildPreviewConnectionConfig,
  classifyCredentialCheckError,
  performReadOnlyCredentialCheck
} from "./lib/preview-credential-readonly-check.mjs";

const productionRef = "prodref12345678901234";
const previewRef = "preview1234567890123";
const fakePassword = "fake p@ss:word/%?#[] only";
const localCertificateFixture = tls.rootCertificates[0];
const localCertificateBase64 = Buffer.from(
  localCertificateFixture,
  "utf8"
).toString("base64");

function validInput(overrides = {}) {
  return {
    productionRef,
    previewRef,
    previewSupabaseUrl: `https://${previewRef}.supabase.co`,
    directUrlTemplate: `postgresql://postgres.${previewRef}:[YOUR-PASSWORD]@ap-northeast-1.pooler.supabase.com:5432/postgres`,
    password: fakePassword,
    certificateBase64: localCertificateBase64,
    ...overrides
  };
}

test("session pooler config uses verified PostgreSQL SSL with SNI", () => {
  const config = buildPreviewConnectionConfig(validInput());
  assert.equal(config.password, fakePassword);
  assert.equal(config.host, "ap-northeast-1.pooler.supabase.com");
  assert.equal(config.user, `postgres.${previewRef}`);
  assert.equal(config.port, 5432);
  assert.equal(config.database, "postgres");
  assert.equal(config.ssl.rejectUnauthorized, true);
  assert.equal(config.ssl.servername, "ap-northeast-1.pooler.supabase.com");
  assert.equal(config.ssl.checkServerIdentity, tls.checkServerIdentity);
  assert.ok(Array.isArray(config.ssl.ca));
  assert.ok(config.ssl.ca.length > 0);
  assert.ok(config.ssl.ca.every((pem) => new X509Certificate(pem).ca));
  assert.equal(config.sslnegotiation, "postgres");
  assert.equal("connectionString" in config, false);
});

test("quoted DIRECT_URL assignment for the session pooler is accepted", () => {
  const config = buildPreviewConnectionConfig(
    validInput({
      directUrlTemplate: `\r\n DIRECT_URL='postgres://postgres.${previewRef}:[YOUR-PASSWORD]@ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require' \r\n`
    })
  );
  assert.equal(config.host, "ap-northeast-1.pooler.supabase.com");
  assert.equal(config.user, `postgres.${previewRef}`);
});

test("a local DER X.509 CA certificate is accepted in memory", () => {
  const certificate = new X509Certificate(localCertificateFixture);
  const config = buildPreviewConnectionConfig(
    validInput({ certificateBase64: certificate.raw.toString("base64") })
  );
  assert.equal(config.ssl.ca.length, 1);
  assert.equal(new X509Certificate(config.ssl.ca[0]).ca, true);
});

test("an invalid certificate is rejected before a client can be created", () => {
  let clientCreated = false;
  assert.throws(
    () => {
      const config = buildPreviewConnectionConfig(
        validInput({
          certificateBase64: Buffer.from("not a certificate", "utf8").toString(
            "base64"
          )
        })
      );
      clientCreated = Boolean(config);
    },
    (error) => error.safeCode === "certificate_invalid"
  );
  assert.equal(clientCreated, false);
});

test("empty or malformed certificate input is rejected locally", () => {
  for (const certificateBase64 of ["", "not-base64%%"] ) {
    assert.throws(
      () => buildPreviewConnectionConfig(validInput({ certificateBase64 })),
      (error) => error.safeCode === "certificate_invalid"
    );
  }
});

test("the credential checker rejects a direct host because this check requires Session Pooler", () => {
  assert.throws(
    () =>
      buildPreviewConnectionConfig(
        validInput({
          directUrlTemplate: `postgresql://postgres:[YOUR-PASSWORD]@db.${previewRef}.supabase.co:5432/postgres`
        })
      ),
    (error) => error.safeCode === "invalid_preview_target"
  );
});

test("the real pg driver keeps PostgreSQL SSLRequest negotiation and verified TLS options", () => {
  const config = buildPreviewConnectionConfig(validInput());
  const client = new pg.Client(config);
  assert.equal(client.connection.sslNegotiation, "postgres");
  assert.equal(client.connectionParameters.ssl.rejectUnauthorized, true);
  assert.equal(
    client.connectionParameters.ssl.servername,
    "ap-northeast-1.pooler.supabase.com"
  );
  assert.equal(client.connectionParameters.ssl.checkServerIdentity, tls.checkServerIdentity);
});

test("target mismatch fails before a client can be created", async () => {
  assert.throws(
    () =>
      buildPreviewConnectionConfig(
        validInput({
          directUrlTemplate:
            "postgresql://postgres.otherpreview123456:[YOUR-PASSWORD]@ap-northeast-1.pooler.supabase.com:5432/postgres"
        })
      ),
    (error) => error.safeCode === "invalid_preview_target"
  );
});

test("the credential check runs only a read-only transaction and SELECT 1", async () => {
  const queries = [];
  let ended = false;
  let connectCount = 0;
  const status = await performReadOnlyCredentialCheck({
    connectionConfig: buildPreviewConnectionConfig(validInput()),
    clientFactory: () => ({
      async connect() {
        connectCount += 1;
      },
      async query(statement) {
        queries.push(statement);
        if (statement === "SELECT 1 AS ok") return { rows: [{ ok: 1 }] };
        return { rows: [] };
      },
      async end() {
        ended = true;
      }
    })
  });

  assert.equal(status, "read_only_check_pass");
  assert.deepEqual(queries, ["BEGIN READ ONLY", "SELECT 1 AS ok", "ROLLBACK"]);
  assert.equal(ended, true);
  assert.equal(connectCount, 1);
});

test("authentication and transport errors return only safe categories", async () => {
  assert.equal(classifyCredentialCheckError({ code: "28P01" }), "authentication_failure");
  assert.equal(
    classifyCredentialCheckError({ message: "Circuit breaker is open" }),
    "temporary_block"
  );
  assert.equal(classifyCredentialCheckError({ code: "ENOTFOUND" }), "dns_failure");
  assert.equal(classifyCredentialCheckError({ code: "ETIMEDOUT" }), "timeout");
  assert.equal(classifyCredentialCheckError({ code: "ECONNRESET" }), "network_failure");
  assert.equal(
    classifyCredentialCheckError({ code: "CERT_HAS_EXPIRED" }),
    "tls_certificate_failure"
  );
  assert.equal(
    classifyCredentialCheckError({ code: "ERR_SSL_WRONG_VERSION_NUMBER" }),
    "tls_protocol_failure"
  );
  assert.equal(classifyCredentialCheckError(new Error("provider detail")), "other_failure");
});

test("runner and GUI contain no file output, migration, or deployment operations", async () => {
  const runner = await readFile(
    new URL("./preview-credential-readonly-check.mjs", import.meta.url),
    "utf8"
  );
  const gui = await readFile(
    new URL("./preview-credential-validator.ps1", import.meta.url),
    "utf8"
  );
  const combined = `${runner}\n${gui}`;

  for (const forbidden of [
    "WriteAllText",
    "Set-Content",
    "Out-File",
    "prisma",
    "migrate",
    "db push",
    "seed",
    "deploy",
    "cleanup"
  ]) {
    assert.doesNotMatch(combined, new RegExp(forbidden, "i"));
  }
  assert.doesNotMatch(runner, /console\.(?:log|error|warn)/);
  assert.doesNotMatch(runner, /process\.env/);
  assert.doesNotMatch(combined, /rejectUnauthorized\s*:\s*false/);
  assert.doesNotMatch(combined, /NODE_TLS_REJECT_UNAUTHORIZED/);
  assert.doesNotMatch(combined, /\btls\.connect\s*\(/);
  assert.doesNotMatch(combined, /\bnet\.connect\s*\(/);
  assert.match(gui, /Supabase SSL certificate/);
  assert.match(gui, /Certificate files \(\*\.crt;\*\.cer;\*\.pem\)/);
  assert.match(gui, /ReadAllBytes/);
  assert.match(gui, /certificateBase64\s*=/);
  assert.doesNotMatch(gui, /StandardOutput\.Write/);
});

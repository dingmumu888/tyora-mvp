import { X509Certificate } from "node:crypto";
import * as tls from "node:tls";

const projectRefPattern = /^[a-z0-9]{8,40}$/;
const passwordPlaceholder = "[YOUR-PASSWORD]";
const maximumCertificateBytes = 262_144;
const maximumCertificateCount = 8;
const safeStatuses = new Set([
  "read_only_check_pass",
  "authentication_failure",
  "temporary_block",
  "dns_failure",
  "timeout",
  "network_failure",
  "tls_certificate_failure",
  "tls_protocol_failure",
  "certificate_invalid",
  "invalid_preview_target",
  "other_failure"
]);

export class PreviewCredentialCheckError extends Error {
  constructor(safeCode) {
    super(safeCode);
    this.name = "PreviewCredentialCheckError";
    this.safeCode = safeCode;
  }
}

function failInvalidTarget() {
  throw new PreviewCredentialCheckError("invalid_preview_target");
}

function failInvalidCertificate() {
  throw new PreviewCredentialCheckError("certificate_invalid");
}

function normalizeDirectUrlTemplate(inputValue) {
  let value = typeof inputValue === "string" ? inputValue.trim() : "";
  if (!value) failInvalidTarget();

  const assignment = value.match(/^DIRECT_URL\s*=\s*([\s\S]*)$/i);
  if (assignment) {
    const body = assignment[1].trim();
    const first = body[0];
    const last = body.at(-1);
    if (body.length < 2 || !["\"", "'"].includes(first) || first !== last) {
      failInvalidTarget();
    }
    value = body.slice(1, -1).trim();
  } else if (/^DIRECT_URL\b/i.test(value)) {
    failInvalidTarget();
  } else if (["\"", "'"].includes(value[0]) || ["\"", "'"].includes(value.at(-1))) {
    if (value.length < 2 || value[0] !== value.at(-1)) failInvalidTarget();
    value = value.slice(1, -1).trim();
  }

  if (!value) failInvalidTarget();
  return value;
}

function validatePreviewIdentity({ productionRef, previewRef, previewSupabaseUrl }) {
  const production = typeof productionRef === "string" ? productionRef.trim() : "";
  const preview = typeof previewRef === "string" ? previewRef.trim() : "";
  const supabaseValue =
    typeof previewSupabaseUrl === "string" ? previewSupabaseUrl.trim() : "";

  if (
    !projectRefPattern.test(production) ||
    !projectRefPattern.test(preview) ||
    production === preview
  ) {
    failInvalidTarget();
  }

  let supabaseUrl;
  try {
    supabaseUrl = new URL(supabaseValue);
  } catch {
    failInvalidTarget();
  }

  if (
    supabaseUrl.protocol !== "https:" ||
    supabaseUrl.hostname !== `${preview}.supabase.co` ||
    supabaseUrl.username ||
    supabaseUrl.password ||
    supabaseUrl.port ||
    !["", "/"].includes(supabaseUrl.pathname) ||
    supabaseUrl.search ||
    supabaseUrl.hash
  ) {
    failInvalidTarget();
  }

  return { production, preview };
}

function validateQuery(url) {
  const entries = [...url.searchParams.entries()];
  if (entries.length === 0) return;
  if (
    entries.length !== 1 ||
    entries[0][0].toLowerCase() !== "sslmode" ||
    !["require", "verify-ca", "verify-full"].includes(entries[0][1].toLowerCase())
  ) {
    failInvalidTarget();
  }
}

export function parseSelectedCertificateAuthorities(certificateBase64) {
  const encoded =
    typeof certificateBase64 === "string" ? certificateBase64.trim() : "";
  if (
    !encoded ||
    encoded.length > Math.ceil(maximumCertificateBytes / 3) * 4 ||
    encoded.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
  ) {
    failInvalidCertificate();
  }

  let certificateBytes;
  try {
    certificateBytes = Buffer.from(encoded, "base64");
    if (
      certificateBytes.length === 0 ||
      certificateBytes.length > maximumCertificateBytes ||
      certificateBytes.toString("base64") !== encoded
    ) {
      failInvalidCertificate();
    }

    const certificateText = certificateBytes.toString("utf8");
    const pemPattern =
      /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
    const pemBlocks = certificateText.match(pemPattern) ?? [];
    let certificates;

    if (pemBlocks.length > 0) {
      if (
        pemBlocks.length > maximumCertificateCount ||
        certificateText.replace(pemPattern, "").trim()
      ) {
        failInvalidCertificate();
      }
      certificates = pemBlocks.map((pem) => new X509Certificate(pem));
    } else {
      certificates = [new X509Certificate(certificateBytes)];
    }

    const certificateAuthorities = certificates
      .filter((certificate) => certificate.ca)
      .map((certificate) => certificate.toString());
    if (certificateAuthorities.length === 0) failInvalidCertificate();
    return certificateAuthorities;
  } catch (error) {
    if (error instanceof PreviewCredentialCheckError) throw error;
    failInvalidCertificate();
  } finally {
    certificateBytes?.fill(0);
  }
}

export function buildPreviewConnectionConfig(input) {
  const { preview } = validatePreviewIdentity(input);
  const template = normalizeDirectUrlTemplate(input.directUrlTemplate);
  const password = typeof input.password === "string" ? input.password : "";
  if (!password || password.length > 4096) failInvalidTarget();

  const firstPlaceholder = template.indexOf(passwordPlaceholder);
  if (
    firstPlaceholder < 0 ||
    firstPlaceholder !== template.lastIndexOf(passwordPlaceholder)
  ) {
    failInvalidTarget();
  }

  const encodedPassword = encodeURIComponent(password);
  const populatedUri = template.replace(passwordPlaceholder, encodedPassword);

  let url;
  try {
    url = new URL(populatedUri);
  } catch {
    failInvalidTarget();
  }

  if (!['postgres:', 'postgresql:'].includes(url.protocol)) failInvalidTarget();
  if (url.port !== "5432" || decodeURIComponent(url.pathname.slice(1)) !== "postgres") {
    failInvalidTarget();
  }
  if (url.hash) failInvalidTarget();
  validateQuery(url);

  let username;
  let decodedPassword;
  try {
    username = decodeURIComponent(url.username);
    decodedPassword = decodeURIComponent(url.password);
  } catch {
    failInvalidTarget();
  }
  if (!username || decodedPassword !== password) failInvalidTarget();

  const isSessionPooler =
    url.hostname.endsWith(".pooler.supabase.com") &&
    username.toLowerCase() === `postgres.${preview}`;
  if (!isSessionPooler) failInvalidTarget();

  const trustedCertificateAuthorities = parseSelectedCertificateAuthorities(
    input.certificateBase64
  );

  return {
    host: url.hostname,
    port: 5432,
    database: "postgres",
    user: username,
    password,
    ssl: {
      rejectUnauthorized: true,
      servername: url.hostname,
      checkServerIdentity: tls.checkServerIdentity,
      ca: trustedCertificateAuthorities
    },
    sslnegotiation: "postgres",
    connectionTimeoutMillis: 10_000,
    query_timeout: 5_000,
    statement_timeout: 5_000
  };
}

export function classifyCredentialCheckError(error) {
  if (error instanceof PreviewCredentialCheckError) return error.safeCode;

  const code = typeof error?.code === "string" ? error.code.toUpperCase() : "";
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";

  if (["28P01", "28000"].includes(code)) return "authentication_failure";
  if (
    message.includes("circuit breaker") ||
    message.includes("temporarily blocked") ||
    message.includes("too many authentication") ||
    message.includes("maximum client connections")
  ) {
    return "temporary_block";
  }
  if (["ENOTFOUND", "EAI_AGAIN", "EAI_FAIL"].includes(code)) {
    return "dns_failure";
  }
  if (
    ["ETIMEDOUT", "ERR_SOCKET_CONNECTION_TIMEOUT"].includes(code) ||
    message.includes("connection timeout")
  ) {
    return "timeout";
  }
  if (["ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH"].includes(code)) {
    return "network_failure";
  }
  const certificateCodes = new Set([
    "CERT_HAS_EXPIRED",
    "CERT_NOT_YET_VALID",
    "DEPTH_ZERO_SELF_SIGNED_CERT",
    "ERR_TLS_CERT_ALTNAME_FORMAT",
    "ERR_TLS_CERT_ALTNAME_INVALID",
    "SELF_SIGNED_CERT_IN_CHAIN",
    "UNABLE_TO_GET_ISSUER_CERT",
    "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
  ]);
  if (
    certificateCodes.has(code) ||
    message.includes("self signed certificate") ||
    message.includes("unable to verify") ||
    message.includes("certificate") ||
    message.includes("hostname/ip does not match certificate")
  ) {
    return "tls_certificate_failure";
  }
  if (
    code.startsWith("ERR_SSL") ||
    code.startsWith("ERR_TLS") ||
    message.includes("ssl routines") ||
    message.includes("tlsv1 alert") ||
    message.includes("wrong version number") ||
    message.includes("server does not support ssl connections") ||
    message.includes("error establishing an ssl connection")
  ) {
    return "tls_protocol_failure";
  }
  return "other_failure";
}

export async function performReadOnlyCredentialCheck({ connectionConfig, clientFactory }) {
  let client;
  let transactionOpen = false;
  try {
    client = clientFactory(connectionConfig);
    await client.connect();
    await client.query("BEGIN READ ONLY");
    transactionOpen = true;
    const result = await client.query("SELECT 1 AS ok");
    if (result?.rows?.[0]?.ok !== 1) {
      throw new PreviewCredentialCheckError("other_failure");
    }
    await client.query("ROLLBACK");
    transactionOpen = false;
    return "read_only_check_pass";
  } catch (error) {
    if (transactionOpen && client) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve only the original safe failure category.
      }
    }
    return classifyCredentialCheckError(error);
  } finally {
    if (client) {
      try {
        await client.end();
      } catch {
        // Connection cleanup must not expose provider details.
      }
    }
  }
}

export function isSafeCredentialStatus(value) {
  return safeStatuses.has(value);
}

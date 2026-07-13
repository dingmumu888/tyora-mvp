const requiredEnvironmentNames = [
  "TYORA_PRODUCTION_PROJECT_REF",
  "TYORA_PREVIEW_PROJECT_REF",
  "PREVIEW_SUPABASE_URL",
  "PREVIEW_DIRECT_URL"
];

const projectRefPattern = /^[a-z0-9]{8,40}$/;
const baselineFingerprintPattern = /^[a-f0-9]{64}$/;

export class PreviewBootstrapSafetyError extends Error {
  constructor(message) {
    super(message);
    this.name = "PreviewBootstrapSafetyError";
  }
}

function requiredValue(environment, name) {
  const value = environment[name]?.trim();
  if (!value) {
    throw new PreviewBootstrapSafetyError(`${name} is required in the process environment.`);
  }
  return value;
}

function validateProjectRef(value, name) {
  if (!projectRefPattern.test(value)) {
    throw new PreviewBootstrapSafetyError(`${name} is not a valid Supabase project ref.`);
  }
}

function parseUrl(value, label) {
  try {
    return new URL(value);
  } catch {
    throw new PreviewBootstrapSafetyError(`${label} is not a valid URL.`);
  }
}

export function validatePreviewBootstrapEnvironment(environment) {
  for (const name of requiredEnvironmentNames) {
    requiredValue(environment, name);
  }

  const productionRef = requiredValue(environment, "TYORA_PRODUCTION_PROJECT_REF").toLowerCase();
  const previewRef = requiredValue(environment, "TYORA_PREVIEW_PROJECT_REF").toLowerCase();
  validateProjectRef(productionRef, "TYORA_PRODUCTION_PROJECT_REF");
  validateProjectRef(previewRef, "TYORA_PREVIEW_PROJECT_REF");
  if (productionRef === previewRef) {
    throw new PreviewBootstrapSafetyError("Production and Preview project refs must differ.");
  }

  const rawSupabaseUrl = requiredValue(environment, "PREVIEW_SUPABASE_URL");
  const rawDirectUrl = requiredValue(environment, "PREVIEW_DIRECT_URL");
  const lowerSupabaseUrl = rawSupabaseUrl.toLowerCase();
  const lowerDirectUrl = rawDirectUrl.toLowerCase();
  if (lowerSupabaseUrl.includes(productionRef) || lowerDirectUrl.includes(productionRef)) {
    throw new PreviewBootstrapSafetyError(
      "Each Preview URL must identify the Preview project ref and exclude the Production project ref."
    );
  }
  if (!lowerSupabaseUrl.includes(previewRef) || !lowerDirectUrl.includes(previewRef)) {
    throw new PreviewBootstrapSafetyError("Both Preview URLs must contain the Preview project ref.");
  }

  const supabaseUrl = parseUrl(rawSupabaseUrl, "PREVIEW_SUPABASE_URL");
  const expectedSupabaseHost = `${previewRef}.supabase.co`;
  if (
    supabaseUrl.protocol !== "https:" ||
    supabaseUrl.hostname !== expectedSupabaseHost ||
    supabaseUrl.username ||
    supabaseUrl.password ||
    supabaseUrl.port ||
    (supabaseUrl.pathname !== "/" && supabaseUrl.pathname !== "") ||
    supabaseUrl.search ||
    supabaseUrl.hash
  ) {
    throw new PreviewBootstrapSafetyError(
      "PREVIEW_SUPABASE_URL must identify the Preview project ref."
    );
  }

  const directUrl = parseUrl(rawDirectUrl, "PREVIEW_DIRECT_URL");
  const databaseName = decodeURIComponent(directUrl.pathname.slice(1));
  if (!directUrl.password) {
    throw new PreviewBootstrapSafetyError(
      "PREVIEW_DIRECT_URL must include its own password."
    );
  }
  if (
    !["postgres:", "postgresql:"].includes(directUrl.protocol) ||
    directUrl.port !== "5432" ||
    !directUrl.username ||
    !directUrl.pathname ||
    directUrl.pathname === "/" ||
    directUrl.hash
  ) {
    throw new PreviewBootstrapSafetyError(
      "PREVIEW_DIRECT_URL must be a direct or session connection using explicit port 5432."
    );
  }
  if (databaseName !== "postgres") {
    throw new PreviewBootstrapSafetyError("PREVIEW_DIRECT_URL must target the postgres database.");
  }

  const connectionParameters = [...directUrl.searchParams.entries()];
  if (connectionParameters.length === 0) {
    throw new PreviewBootstrapSafetyError(
      "PREVIEW_DIRECT_URL must explicitly require TLS with sslmode."
    );
  }
  if (
    connectionParameters.length > 1 ||
    connectionParameters[0][0].toLowerCase() !== "sslmode"
  ) {
    throw new PreviewBootstrapSafetyError(
      "PREVIEW_DIRECT_URL query parameters may contain only sslmode."
    );
  }

  const decodedUsername = decodeURIComponent(directUrl.username).toLowerCase();
  const directHost = `db.${previewRef}.supabase.co`;
  let connectionMode;
  if (directUrl.hostname === directHost) {
    connectionMode = "direct";
  } else if (
    directUrl.hostname.endsWith(".pooler.supabase.com") &&
    decodedUsername === `postgres.${previewRef}`
  ) {
    connectionMode = "session-pooler";
  } else {
    throw new PreviewBootstrapSafetyError(
      "PREVIEW_DIRECT_URL must identify the Preview project ref in its host or session username."
    );
  }

  const sslMode = connectionParameters[0][1].toLowerCase();
  if (!sslMode || !["require", "verify-ca", "verify-full"].includes(sslMode)) {
    throw new PreviewBootstrapSafetyError(
      "PREVIEW_DIRECT_URL must explicitly require TLS with sslmode."
    );
  }

  return {
    productionRef,
    previewRef,
    supabaseHost: supabaseUrl.hostname,
    databaseHost: directUrl.hostname,
    connectionMode,
    databaseName
  };
}

export function parsePreviewBootstrapArguments(argumentsList) {
  if (argumentsList.length === 0) {
    return { apply: false, expectedFingerprint: null };
  }
  if (
    argumentsList.length === 3 &&
    argumentsList[0] === "--apply" &&
    argumentsList[1] === "--fingerprint" &&
    baselineFingerprintPattern.test(argumentsList[2])
  ) {
    return { apply: true, expectedFingerprint: argumentsList[2] };
  }
  throw new PreviewBootstrapSafetyError(
    "Apply mode requires --apply --fingerprint followed by the complete dry-run fingerprint."
  );
}

export function assertTypedPreviewConfirmation(typedValue, previewRef) {
  if (typedValue.trim() !== previewRef) {
    throw new PreviewBootstrapSafetyError("Typed confirmation does not match the Preview project ref.");
  }
}

export function assertExpectedBaselineFingerprint(actualFingerprint, expectedFingerprint) {
  if (
    !baselineFingerprintPattern.test(actualFingerprint) ||
    !baselineFingerprintPattern.test(expectedFingerprint) ||
    actualFingerprint !== expectedFingerprint
  ) {
    throw new PreviewBootstrapSafetyError(
      "The current Preview baseline fingerprint does not match the reviewed dry-run."
    );
  }
}

export function canonicalizeMigrationSqlForChecksum(value) {
  return value.replace(/\r\n?/g, "\n");
}

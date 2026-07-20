import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { parseSelectedCertificateAuthorities } from "./preview-credential-readonly-check.mjs";

import {
  canonicalizeMigrationSqlForChecksum,
  createPreviewBootstrapConnectionConfig,
  PreviewBootstrapSafetyError,
  validatePreviewBootstrapEnvironment
} from "./preview-bootstrap-safety.mjs";

export const phase5bMigrationName = "20260720010000_phase_5a_submission_workflow";
export const phase5bMigrationSha256 = "52a7550c619df71a872bfff30c390666a7eedaa1671572d47737786a5be93edb";
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
  const allowed = new Set([...phase5bPriorMigrations, phase5bMigrationName]);
  if ([...byName.keys()].some((name) => !allowed.has(name))) {
    throw new Phase5bPreviewMigrationError("Preview migration history contains an unexpected migration.");
  }

  const phase5b = byName.get(phase5bMigrationName);
  if (phase5b && phase5b.checksum !== phase5bMigrationSha256) {
    throw new Phase5bPreviewMigrationError("The applied Phase 5A migration checksum does not match.");
  }
  return { phase5bAlreadyApplied: Boolean(phase5b) };
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

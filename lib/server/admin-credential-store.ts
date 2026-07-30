import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "@/lib/server/db";

const ADMIN_CREDENTIAL_ROW_ID = "__admin_credential_v1__";
const SCRYPT_KEY_LENGTH = 64;
const scryptAsync = promisify(scrypt);

type StoredAdminCredential = {
  algorithm: "scrypt";
  salt: string;
  passwordHash: string;
  version: number;
  updatedAt: string;
};

function safeStringEqual(left: string, right: string) {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

async function derivePasswordHash(password: string, salt: string) {
  const derived = (await scryptAsync(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  return derived.toString("base64url");
}

function parseStoredCredential(value: string): StoredAdminCredential | null {
  try {
    const parsed = JSON.parse(value) as Partial<StoredAdminCredential>;
    if (
      parsed.algorithm !== "scrypt" ||
      typeof parsed.salt !== "string" ||
      typeof parsed.passwordHash !== "string" ||
      typeof parsed.version !== "number" ||
      !Number.isSafeInteger(parsed.version) ||
      parsed.version < 1
    ) {
      return null;
    }
    return parsed as StoredAdminCredential;
  } catch {
    return null;
  }
}

async function getStoredCredential() {
  const row = await prisma.siteContent.findUnique({
    where: { id: ADMIN_CREDENTIAL_ROW_ID },
    select: { data: true }
  });
  if (!row) return null;
  const credential = parseStoredCredential(row.data);
  if (!credential) {
    throw new Error("Stored admin credential is invalid.");
  }
  return credential;
}

export async function getAdminCredentialVersion() {
  const stored = await getStoredCredential();
  return stored?.version ?? 0;
}

export async function verifyAdminPassword(password: string) {
  const stored = await getStoredCredential();
  if (stored) {
    const candidateHash = await derivePasswordHash(password, stored.salt);
    return {
      configured: true,
      valid: safeStringEqual(candidateHash, stored.passwordHash),
      version: stored.version
    };
  }

  const environmentPassword = process.env.ADMIN_PASSWORD;
  return {
    configured: Boolean(environmentPassword),
    valid: Boolean(environmentPassword) && safeStringEqual(password, environmentPassword || ""),
    version: 0
  };
}

export async function updateAdminPassword(password: string) {
  const current = await getStoredCredential();
  const salt = randomBytes(24).toString("base64url");
  const next: StoredAdminCredential = {
    algorithm: "scrypt",
    salt,
    passwordHash: await derivePasswordHash(password, salt),
    version: (current?.version ?? 0) + 1,
    updatedAt: new Date().toISOString()
  };

  await prisma.siteContent.upsert({
    where: { id: ADMIN_CREDENTIAL_ROW_ID },
    create: {
      id: ADMIN_CREDENTIAL_ROW_ID,
      data: JSON.stringify(next)
    },
    update: {
      data: JSON.stringify(next)
    }
  });

  return next.version;
}

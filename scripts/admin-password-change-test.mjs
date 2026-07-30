import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("admin password is stored as a salted scrypt hash", async () => {
  const source = await read("lib/server/admin-credential-store.ts");
  assert.match(source, /randomBytes/);
  assert.match(source, /scrypt/);
  assert.match(source, /timingSafeEqual/);
  assert.match(source, /passwordHash/);
  assert.doesNotMatch(source, /data:\s*password\b/);
});

test("login uses the credential store and versioned sessions", async () => {
  const login = await read("app/api/admin/login/route.ts");
  const auth = await read("lib/server/admin-auth.ts");
  assert.match(login, /verifyAdminPassword/);
  assert.match(login, /result\.version/);
  assert.match(auth, /pv:\s*credentialVersion/);
  assert.match(auth, /getAdminCredentialVersion/);
  assert.match(auth, /session\.pv ===/);
});

test("password change requires an authenticated session and current password", async () => {
  const route = await read("app/api/admin/password/route.ts");
  assert.match(route, /requireAdminSession/);
  assert.match(route, /verifyAdminPassword\(currentPassword\)/);
  assert.match(route, /MIN_PASSWORD_LENGTH = 12/);
  assert.match(route, /updateAdminPassword\(newPassword\)/);
  assert.match(route, /clearAdminSessionCookie/);
  assert.doesNotMatch(route, /console\./);
});

test("admin UI asks for current, new, and confirmed passwords", async () => {
  const page = await read("app/admin/page.tsx");
  assert.match(page, /AdminPasswordSettings/);
  assert.match(page, /autoComplete="current-password"/);
  assert.equal((page.match(/autoComplete="new-password"/g) || []).length, 2);
  assert.match(page, /window\.location\.assign\("\/admin"\)/);
});

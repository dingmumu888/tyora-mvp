import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("community login persists securely for 30 days and refreshes before expiry", async () => {
  const auth = await read("lib/server/community-auth.ts");

  assert.match(auth, /const SESSION_TTL_SECONDS = 60 \* 60 \* 24 \* 30/);
  assert.match(auth, /const SESSION_REFRESH_THRESHOLD_SECONDS = 60 \* 60 \* 24 \* 14/);
  assert.match(auth, /httpOnly:\s*true/);
  assert.match(auth, /sameSite:\s*"lax"/);
  assert.match(auth, /secure:\s*process\.env\.NODE_ENV === "production"/);
  assert.match(auth, /maxAge:\s*SESSION_TTL_SECONDS/);
});

test("the production apex domain redirects to the canonical www host", async () => {
  const config = await read("next.config.ts");

  assert.match(config, /type:\s*"host"/);
  assert.match(config, /value:\s*"tyora\.io"/);
  assert.match(config, /destination:\s*"https:\/\/www\.tyora\.io\/:path\*"/);
  assert.match(config, /permanent:\s*true/);
});

test("the login dialog explains persistent login using localized copy", async () => {
  const [login, i18n] = await Promise.all([
    read("components/email-login.tsx"),
    read("lib/public-i18n.ts")
  ]);

  assert.match(login, /copy\.common\.rememberLogin/);
  assert.match(login, /ShieldCheck/);
  assert.match(i18n, /rememberLogin:\s*string/);
  assert.equal((i18n.match(/rememberLogin:/g) || []).length, 7);
});

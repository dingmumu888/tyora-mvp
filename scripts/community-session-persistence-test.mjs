import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("community login uses a secure 30-day sliding inactivity window", async () => {
  const auth = await read("lib/server/community-auth.ts");

  assert.match(auth, /const SESSION_TTL_SECONDS = 60 \* 60 \* 24 \* 30/);
  assert.doesNotMatch(auth, /SESSION_REFRESH_THRESHOLD_SECONDS/);
  assert.match(auth, /return session\.expiresAt > now/);
  assert.match(auth, /if \(shouldRefreshCommunitySession\(session\)\) \{\s*return setCommunitySessionCookie\(response, session\)/);
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

test("the login dialog does not expose the internal session duration", async () => {
  const [login, i18n] = await Promise.all([
    read("components/email-login.tsx"),
    read("lib/public-i18n.ts")
  ]);

  assert.doesNotMatch(login, /copy\.common\.rememberLogin/);
  assert.doesNotMatch(login, /ShieldCheck/);
  assert.doesNotMatch(i18n, /rememberLogin:\s*string/);
  assert.equal((i18n.match(/rememberLogin:/g) || []).length, 0);
});

test("pending email verification survives an accidental close until the real code expiry", async () => {
  const [login, constants, requestRoute, emailLoginServer, i18n] = await Promise.all([
    read("components/email-login.tsx"),
    read("lib/email-login-constants.ts"),
    read("app/api/community/auth/email/request/route.ts"),
    read("lib/server/email-login.ts"),
    read("lib/public-i18n.ts")
  ]);

  assert.match(constants, /EMAIL_LOGIN_CODE_TTL_MINUTES = 10/);
  assert.match(login, /PENDING_EMAIL_LOGIN_STORAGE_KEY/);
  assert.match(login, /window\.localStorage\.setItem/);
  assert.match(login, /readPendingEmailLogin/);
  assert.match(login, /formatCountdown/);
  assert.match(login, /tabular-nums/);
  assert.match(login, /min-w-\[3\.25rem\]/);
  assert.match(login, /min-h-\[68px\]/);
  assert.match(login, /codeExpired/);
  assert.match(login, /copy\.login\.sendAgain/);
  assert.match(requestRoute, /expiresInSeconds:\s*EMAIL_LOGIN_CODE_TTL_SECONDS/);
  assert.match(emailLoginServer, /EMAIL_LOGIN_CODE_TTL_MINUTES \* 60 \* 1000/);
  assert.equal((i18n.match(/brandSubtitle:/g) || []).length, 7);
  assert.equal((i18n.match(/resumeHint:/g) || []).length, 7);
});

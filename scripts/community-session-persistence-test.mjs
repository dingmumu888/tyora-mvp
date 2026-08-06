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

test("logout immediately clears every auth-sensitive community surface", async () => {
  const [comments, actions, newIdea, profileGate] = await Promise.all([
    read("app/ask/[slug]/idea-comments.tsx"),
    read("app/ask/[slug]/idea-actions.tsx"),
    read("app/ask/new/new-idea-client.tsx"),
    read("components/community-profile-gate.tsx")
  ]);

  for (const source of [comments, actions, newIdea, profileGate]) {
    assert.match(source, /addEventListener\("tyora:community-logout"/);
    assert.match(source, /removeEventListener\("tyora:community-logout"/);
  }
  assert.match(comments, /user && replyingTo\?\.id === comment\.id/);
  assert.match(comments, /data-auth-gate="comment-reply"[\s\S]*?<EmailLogin[\s\S]*?onSuccess=\{\(\) => \{[\s\S]*?setReplyingTo\(comment\)/);
});

test("login and logout synchronize across tabs and browser-restored pages", async () => {
  const [sync, bridge, layout, login, userMenu, myTyoraLogout] = await Promise.all([
    read("lib/client/community-session-sync.ts"),
    read("components/community-session-sync.tsx"),
    read("app/layout.tsx"),
    read("components/email-login.tsx"),
    read("components/community-user-menu.tsx"),
    read("components/my-tyora-logout-button.tsx")
  ]);

  assert.match(sync, /localStorage\.setItem\(COMMUNITY_SESSION_SYNC_KEY/);
  assert.match(sync, /BroadcastChannel\(COMMUNITY_SESSION_CHANNEL\)/);
  assert.match(bridge, /addEventListener\("storage", onStorage\)/);
  assert.match(bridge, /channel\.onmessage/);
  assert.match(bridge, /signal\?\.type === "logout"/);
  assert.match(bridge, /addEventListener\("pageshow", onPageShow\)/);
  assert.match(bridge, /addEventListener\("focus", onPageShow\)/);
  assert.match(bridge, /visibilityState === "visible"/);
  assert.match(bridge, /fetch\("\/api\/community\/session", \{ cache: "no-store" \}\)/);
  assert.match(layout, /<CommunitySessionSync \/>/);
  assert.match(login, /broadcastCommunitySessionChange\("login", payload\.user\)/);
  assert.match(userMenu, /broadcastCommunitySessionChange\("logout"\)/);
  assert.match(userMenu, /addEventListener\("tyora:community-logout", onLogout\)/);
  assert.match(myTyoraLogout, /broadcastCommunitySessionChange\("logout"\)/);
});

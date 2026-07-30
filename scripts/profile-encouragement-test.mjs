import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("profile encouragements are CMS-managed in all public languages", async () => {
  const [storage, serverDefaults, admin] = await Promise.all([
    read("lib/storage.ts"),
    read("lib/server/profile-encouragement-defaults.ts"),
    read("app/admin/community/community-admin-client.tsx")
  ]);

  for (const code of ["en", "zh-CN", "es", "fr", "de", "pt"]) {
    assert.match(serverDefaults, new RegExp(`(?:\"${code}\"|${code}): \\[`));
    assert.match(admin, new RegExp(`\\[\"${code}\",`));
  }
  assert.match(storage, /profileEncouragements: ProfileEncouragements/);
  assert.match(storage, /normalizeProfileEncouragements/);
  assert.match(admin, /profileEncouragements-\$\{code\}/);
});

test("the My TYORA profile card rotates per login, stays stable in-session, and supports another message", async () => {
  const [card, modal, profilePage, auth] = await Promise.all([
    read("components/profile-encouragement-card.tsx"),
    read("components/community-profile-modal.tsx"),
    read("app/me/page.tsx"),
    read("lib/server/community-auth.ts")
  ]);

  assert.match(card, /sessionSeed/);
  assert.match(card, /tyora-profile-encouragement:/);
  assert.match(card, /previous\?\.sessionSeed === sessionSeed/);
  assert.match(card, /nextIndex === previous\.index/);
  assert.match(card, /showAnother/);
  assert.match(card, /anotherEncouragement/);
  assert.match(card, /fetch\("\/api\/content"/);
  assert.match(card, /<Sparkles/);
  assert.match(profilePage, /sessionSeed=\{session\.issuedAt\}/);
  assert.match(auth, /issuedAt: session\.iat/);
  assert.doesNotMatch(modal, /profileEncouragement|dailyEncouragementIndex|<Sparkles/);
});

test("default encouragements stay grounded and avoid celebrity promises", async () => {
  const defaults = await read("lib/server/profile-encouragement-defaults.ts");

  assert.doesNotMatch(defaults, /Steve Jobs|Elon Musk|next billionaire|改变世界|乔布斯|马斯克/i);
  assert.match(defaults, /真实反馈/);
  assert.match(defaults, /Every honest piece of feedback/);
});

test("legacy saved content receives the complete server-side defaults", async () => {
  const store = await read("lib/server/data-store.ts");

  assert.match(store, /withProfileEncouragementDefaults/);
  assert.match(store, /defaultProfileEncouragements/);
  assert.match(store, /normalizeContent\(withProfileEncouragementDefaults\(stored\)\)/);
});

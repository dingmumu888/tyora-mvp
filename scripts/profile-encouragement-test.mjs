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

test("the profile modal selects one stable localized message per account and day", async () => {
  const modal = await read("components/community-profile-modal.tsx");

  assert.match(modal, /dailyEncouragementIndex/);
  assert.match(modal, /`\$\{userId\}:\$\{new Date\(\)\.toISOString\(\)\.slice\(0, 10\)\}`/);
  assert.match(modal, /encouragements\[language\]/);
  assert.match(modal, /fetch\("\/api\/content"/);
  assert.match(modal, /<Sparkles/);
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

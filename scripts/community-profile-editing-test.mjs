import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the signed-in avatar opens the profile menu", async () => {
  const menu = await read("components/community-user-menu.tsx");

  assert.match(menu, /onClick=\{\(\) => setMenuOpen\(\(current\) => !current\)\}/);
  assert.match(menu, /aria-expanded=\{menuOpen\}/);
  assert.match(menu, /role="menu"/);
  assert.match(menu, /setProfileOpen\(true\)/);
});

test("My TYORA exposes profile editing and refreshes after save", async () => {
  const [page, editor, menu] = await Promise.all([
    read("app/me/page.tsx"),
    read("components/community-profile-editor.tsx"),
    read("components/community-user-menu.tsx")
  ]);

  assert.match(page, /<CommunityProfileEditor user=\{user\} \/>/);
  assert.match(editor, /copy\.common\.editProfile/);
  assert.match(editor, /router\.refresh\(\)/);
  assert.match(menu, /router\.refresh\(\)/);
});

test("updated inline avatars receive a content version in their public URL", async () => {
  const store = await read("lib/server/community-store.ts");
  const avatarRoute = await read("app/api/community/users/[userId]/avatar/route.ts");

  assert.match(store, /createHash\("sha256"\)\.update\(url\)\.digest\("hex"\)\.slice\(0, 12\)/);
  assert.match(store, /\/avatar\?v=\$\{version\}/);
  assert.match(avatarRoute, /Cache-Control": "public, max-age=31536000, immutable"/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("My TYORA has complete dictionaries for every public language", async () => {
  const source = await read("lib/my-tyora-i18n.ts");
  for (const language of ["en", "zh-CN", "es", "fr", "de", "pt"]) {
    assert.match(source, new RegExp(`(?:\"${language}\"|${language})[:,]`));
  }
  for (const key of ["profileActivity", "home", "productCreator", "posts", "messages", "privateCustom", "logout", "editProfileTitle"]) {
    assert.match(source, new RegExp(`${key}:`));
  }
  assert.match(source, /Record<PublicLanguage, Dictionary>/);
});

test("the profile page and its interactive panels use the shared My TYORA translations", async () => {
  const [page, summary, messages, modal, logout] = await Promise.all([
    read("app/me/page.tsx"),
    read("app/me/activity-summary.tsx"),
    read("app/me/activity-messages.tsx"),
    read("components/community-profile-modal.tsx"),
    read("components/my-tyora-logout-button.tsx")
  ]);

  assert.match(page, /<MyTyoraText textKey="profileActivity"/);
  assert.match(page, /<MyTyoraText textKey=\{item\.label\}/);
  assert.match(page, /<MyTyoraText textKey="privateCustom"/);
  assert.match(summary, /translateMyTyora\(language/);
  assert.match(messages, /translateMyTyora\(language/);
  assert.match(modal, /translateMyTyora\(language/);
  assert.match(logout, /translateMyTyora\(language, "logout"\)/);
});

test("Chinese profile copy covers all text visible in the main account card", async () => {
  const source = await read("lib/my-tyora-i18n.ts");
  for (const text of ["个人资料与动态", "首页", "找货", "热门", "产品创作者", "帖子", "消息", "私密定制", "发布帖子", "退出登录"]) {
    assert.match(source, new RegExp(text));
  }
});

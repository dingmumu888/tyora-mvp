import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the new discussion flow has complete public-language dictionaries", async () => {
  const source = await read("lib/new-idea-i18n.ts");

  for (const language of ["en", "zh-CN", "es", "fr", "de", "pt"]) {
    assert.match(source, new RegExp(`(?:\"${language}\"|${language})[:,]`));
  }
  assert.match(source, /Record<PublicLanguage, Dictionary>/);
  for (const copy of [
    "发起讨论",
    "产品名称",
    "一句话介绍创意",
    "展示你的创意",
    "帮助 TYORA 了解你的创意",
    "谁可以查看这次提交",
    "提交评估",
    "发布之后",
    "填写建议"
  ]) {
    assert.match(source, new RegExp(copy));
  }
});

test("every visible stage of the new discussion page uses its localized copy", async () => {
  const page = await read("app/ask/new/new-idea-client.tsx");

  assert.match(page, /usePublicLanguage\(\)/);
  assert.match(page, /translateNewIdea\(language/);
  assert.match(page, /translateCommunityText\(language, postType\)/);
  assert.match(page, /translateCommunityText\(language, productStage\)/);
  assert.match(page, /t\("whoCanSee"\)/);
  assert.match(page, /t\("readySubmit"\)/);
  assert.match(page, /t\("afterPublish"\)/);

  for (const rawEnglish of [
    ">Start a Discussion<",
    ">Product name<",
    ">One-sentence idea<",
    ">After you publish<",
    ">Helpful tips<",
    'placeholder="Magnetic phone stand"'
  ]) {
    assert.doesNotMatch(page, new RegExp(rawEnglish));
  }
});

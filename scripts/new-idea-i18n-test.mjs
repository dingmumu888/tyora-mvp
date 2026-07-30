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
    "你希望 TYORA 回答什么问题？",
    "自定义问题",
    "让大家看见你创意里的亮点",
    "灵感别藏着",
    "继续，让创意更接近现实",
    "发布后，创意开始向前走",
    "说人话：简单、清楚、有重点",
    "谁可以查看这次提交",
    "提交评估"
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

test("the new discussion header uses the admin-configurable site brand", async () => {
  const route = await read("app/ask/new/page.tsx");
  const page = await read("app/ask/new/new-idea-client.tsx");

  assert.match(route, /getContent\(\)/);
  assert.match(route, /logoImage: content\.logoImage/);
  assert.match(route, /showBrandNameWithLogo: content\.showBrandNameWithLogo/);
  assert.match(page, /brand\.logoImage/);
  assert.match(page, /brand\.showBrandNameWithLogo/);
  assert.match(page, /brand\.brandName/);
  assert.doesNotMatch(page, /<Sparkles size=\{15\} \/><\/span>\s*\{t\("community"\)\}/);
});

test("uploaded idea images are previewed without cropping", async () => {
  const page = await read("app/ask/new/new-idea-client.tsx");

  assert.match(page, /aspect-square w-full bg-\[#f8fafc\] object-contain/);
  assert.match(page, /size-24 shrink-0 rounded-2xl bg-\[#f8fafc\] object-contain/);
  assert.doesNotMatch(page, /image\.url[^>]+object-cover/);
});

test("customers submit only the TYORA questions they actually choose", async () => {
  const page = await read("app/ask/new/new-idea-client.tsx");

  assert.match(page, /questions: form\.questions/);
  assert.match(page, /form\.questions\.includes\("Other"\) && !form\.otherQuestion\.trim\(\)/);
  assert.match(page, /<textarea[\s\S]+otherQuestionPlaceholder/);
  assert.match(page, /question === "Other" && form\.otherQuestion\.trim\(\)/);
  assert.doesNotMatch(page, /defaultQuestions/);
});

test("the idea-detail step uses TYORA's energetic but credible voice", async () => {
  const page = await read("app/ask/new/new-idea-client.tsx");
  const copy = await read("lib/new-idea-i18n.ts");

  assert.match(page, /t\(step === 2 \? "continueCloser" : "next"\)/);
  assert.match(copy, /continueCloser: "Continue and bring your idea closer to reality"|continueCloser: "Keep going — bring it closer to reality"/);
  assert.match(copy, /helpUnderstand: "让大家看见你创意里的亮点"/);
  assert.match(copy, /afterPublish: "发布后，创意开始向前走"/);
});

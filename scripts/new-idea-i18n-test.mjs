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
    "确认发布"
  ]) {
    assert.match(source, new RegExp(copy));
  }
});

test("every visible stage of the new discussion page uses its localized copy", async () => {
  const page = await read("app/ask/new/new-idea-client.tsx");

  assert.match(page, /usePublicLanguage\(\)/);
  assert.match(page, /translateNewIdea\(language/);
  assert.match(page, /postType: "Idea Feedback" as CommunityPostType/);
  assert.match(page, /productStage: "Concept" as CommunityProductStage/);
  assert.doesNotMatch(page, /communityPostTypes\.map/);
  assert.doesNotMatch(page, /communityProductStages\.map/);
  assert.match(page, /t\("whoCanSee"\)/);
  assert.match(page, /t\("readySubmit"\)/);
  assert.match(page, /t\("afterPublish"\)/);
  assert.match(page, /publicDisclosureConsent/);
  assert.match(page, /PUBLIC_DISCLOSURE_NOTICE_VERSION/);
  assert.match(page, /publicConsentLocale: form\.visibility === "Public" \? language/);
  assert.doesNotMatch(page, /form\.publicImageConsent/);
  assert.doesNotMatch(page, /form\.publicAssessmentConsent/);

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

test("protected creator actions request email login before data entry", async () => {
  const [page, comments] = await Promise.all([
    read("app/ask/new/new-idea-client.tsx"),
    read("app/ask/[slug]/idea-comments.tsx")
  ]);

  assert.match(page, /if \(!user\) \{[\s\S]+data-auth-gate="new-discussion"/);
  assert.match(page, /data-auth-gate="new-discussion"[\s\S]+<EmailLogin[\s\S]+openSignal=\{1\}/);
  assert.match(comments, /data-auth-gate="comment-composer"[\s\S]+<EmailLogin/);
  assert.match(comments, /data-auth-gate="comment-reply"[\s\S]+<EmailLogin/);
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
  const preview = await read("components/editable-idea-images.tsx");

  assert.match(page, /EditableIdeaImages/);
  assert.match(preview, /aspect-\[4\/3\]/);
  assert.match(preview, /relative size-full object-contain/);
  assert.match(preview, /setPreviewIndex\(index\)/);
  assert.match(preview, /max-h-\[88vh\] max-w-\[90vw\] object-contain/);
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

test("the public experience self-hosts matching Latin and Simplified Chinese variable fonts", async () => {
  const layout = await read("app/layout.tsx");
  const styles = await read("app/globals.css");
  const packageJson = await read("package.json");

  assert.match(layout, /@fontsource-variable\/reddit-sans\/wght\.css/);
  assert.match(layout, /@fontsource-variable\/noto-sans-sc\/wght\.css/);
  assert.match(styles, /"Reddit Sans Variable", "Noto Sans SC Variable"/);
  assert.match(packageJson, /"@fontsource-variable\/reddit-sans"/);
  assert.match(packageJson, /"@fontsource-variable\/noto-sans-sc"/);
});

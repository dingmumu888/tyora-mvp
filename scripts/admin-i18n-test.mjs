import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("admin layout provides one persistent language context", async () => {
  const [layout, provider, shell] = await Promise.all([
    read("app/admin/layout.tsx"),
    read("components/admin/admin-language-provider.tsx"),
    read("components/admin/admin-shell.tsx")
  ]);

  assert.match(layout, /<AdminLanguageProvider>/);
  assert.match(provider, /tyora-admin-language/);
  assert.match(provider, /localStorage\.setItem/);
  assert.match(shell, /toggleLanguage/);
  assert.match(shell, /className="inline-flex min-h-11 shrink-0 items-center/);
  assert.doesNotMatch(shell, /onToggleLanguage/);
  assert.doesNotMatch(shell, /languageLabel/);
});

test("admin queues translate interface text and customer-facing record content", async () => {
  const [workOrders, community, source] = await Promise.all([
    read("app/admin/work-orders/work-orders-admin-client.tsx"),
    read("app/admin/community/community-admin-client.tsx"),
    read("app/admin/source/source-admin-client.tsx")
  ]);

  assert.match(workOrders, /\{t\(order\.title\)\}/);
  assert.match(workOrders, /t\(order\.description/);
  assert.match(community, /\{t\(idea\.title\)\}/);
  assert.match(community, /\{t\(idea\.description\)\}/);
  assert.match(source, /t\(request\.productName\)/);
  assert.match(source, /t\(request\.description/);
  for (const sourceText of [workOrders, community, source]) {
    assert.doesNotMatch(sourceText, /onToggleLanguage=\{\(\) => undefined\}/);
    assert.doesNotMatch(sourceText, /languageLabel="EN"/);
  }
});

test("Chinese dictionary covers the current production inbox and curated posts", async () => {
  const dictionary = await read("lib/admin-i18n.ts");
  for (const phrase of [
    "Unified Inbox",
    "Search product, customer, country, or ID",
    "Select an Inbox item",
    "Ideas Moderation",
    "Source Products Queue",
    "phone case",
    "iphone case product reference",
    "Magnetic Phone Stand",
    "Capybara Night Light",
    "Pet Grooming Tool"
  ]) {
    assert.match(dictionary, new RegExp(`${JSON.stringify(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`));
  }
});

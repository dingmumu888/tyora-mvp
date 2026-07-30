import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("profile editing uses one public name and keeps the internal username hidden", async () => {
  const [modal, profilePage, menu] = await Promise.all([
    read("components/community-profile-modal.tsx"),
    read("app/me/page.tsx"),
    read("components/community-user-menu.tsx")
  ]);

  assert.match(modal, /t\("websiteName"\)/);
  assert.doesNotMatch(modal, /setUsername|data\.username|JSON\.stringify\(\{ name, username/);
  assert.doesNotMatch(profilePage, /@\{user\.username\}/);
  assert.doesNotMatch(menu, /@\{user\.username\}/);
});

test("industry, editable occupation, and searchable country are saved as structured profile data", async () => {
  const [modal, store, options, schema, migration] = await Promise.all([
    read("components/community-profile-modal.tsx"),
    read("lib/server/community-store.ts"),
    read("lib/profile-options.ts"),
    read("prisma/schema.prisma"),
    read("prisma/migrations/20260730010000_add_community_profile_details/migration.sql")
  ]);

  assert.match(modal, /profileIndustries\.map/);
  assert.match(modal, /occupationPlaceholder/);
  assert.match(modal, /searchCountry/);
  assert.match(modal, /Intl\.DisplayNames/);
  assert.match(modal, /countryCallingCodes/);
  assert.match(store, /isProfileIndustry\(industry\)/);
  assert.match(store, /profileCountryFromCode/);
  assert.match(store, /countryCode: countryOption\.iso/);
  assert.match(options, /physical-retail/);
  assert.match(schema, /countryCode\s+String\?/);
  assert.match(schema, /industry\s+String\?/);
  assert.match(schema, /occupation\s+String\?/);
  assert.match(migration, /ADD COLUMN "countryCode" TEXT/);
});

test("first-time profile setup cannot be dismissed before required details are saved", async () => {
  const [modal, gate] = await Promise.all([
    read("components/community-profile-modal.tsx"),
    read("components/community-profile-gate.tsx")
  ]);

  assert.match(modal, /const canDismiss = mode === "edit"/);
  assert.match(modal, /event\.key === "Escape" && canDismiss/);
  assert.match(modal, /event\.target === event\.currentTarget && canDismiss/);
  assert.doesNotMatch(modal, /t\("maybeLater"\)/);
  assert.doesNotMatch(gate, /profile_setup_skipped|rememberSkipped|wasSkipped/);
  assert.match(gate, /setOpen\(!nextUser\.profileCompleted\)/);
  assert.match(gate, /if \(user\?\.profileCompleted\) setOpen\(false\)/);
});

test("the selected profile country is preferred in admin and prefills new discussions", async () => {
  const [customers, newIdea, countryName] = await Promise.all([
    read("lib/server/customer-store.ts"),
    read("app/ask/new/new-idea-client.tsx"),
    read("components/profile-country-name.tsx")
  ]);

  assert.match(customers, /country: row\.country \|\| row\.lastCountry/);
  assert.match(newIdea, /country: current\.country\.trim\(\) \? current\.country : nextUser\.country/);
  assert.match(newIdea, /tyora:community-profile-updated/);
  assert.match(countryName, /countryCallingCodes/);
  assert.match(countryName, /flag \? `\$\{flag\} `/);
});

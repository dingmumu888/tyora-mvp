import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assertCanReadCustomInquiry,
  canReadCustomInquiry,
  CustomInquiryNotFoundError
} from "../lib/server/custom-inquiry-policy.ts";

const file = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const inquiry = { userId: "owner-user" };

test("owner can read the private Custom inquiry", () => {
  assert.equal(canReadCustomInquiry(inquiry, { userId: "owner-user" }), true);
  assert.doesNotThrow(() => assertCanReadCustomInquiry(inquiry, { userId: "owner-user" }));
});

test("anonymous visitors receive the same not-found policy", () => {
  assert.equal(canReadCustomInquiry(inquiry), false);
  assert.throws(() => assertCanReadCustomInquiry(inquiry), CustomInquiryNotFoundError);
});

test("a different logged-in user receives the same not-found policy", () => {
  assert.equal(canReadCustomInquiry(inquiry, { userId: "different-user" }), false);
  assert.throws(
    () => assertCanReadCustomInquiry(inquiry, { userId: "different-user" }),
    CustomInquiryNotFoundError
  );
});

test("authorized Admin access follows the existing policy", () => {
  assert.equal(canReadCustomInquiry(inquiry, { isAdmin: true }), true);
  assert.doesNotThrow(() => assertCanReadCustomInquiry(inquiry, { isAdmin: true }));
});

test("the protected API preserves owner/Admin authorization and private caching for every outcome", async () => {
  const route = await file("app/api/community/custom/[id]/route.ts");

  assert.match(route, /getCommunitySession\(\)/);
  assert.match(route, /hasAdminSession\(\)/);
  assert.match(route, /userId: session\?\.userId/);
  assert.match(route, /isAdmin/);
  assert.match(route, /CustomInquiryNotFoundError/);
  assert.match(route, /privateFail\("Not found\.", 404\)/);
  assert.match(route, /"Cache-Control": "private, no-store"/);
  assert.doesNotMatch(route, /Unauthorized|Forbidden|401|403/);
});

test("the owner detail page uses the protected API and maps hidden records to a real 404", async () => {
  const [page, notFoundPage, errorPage, loadingPage, headers] = await Promise.all([
    file("app/me/custom/[id]/page.tsx"),
    file("app/me/custom/[id]/not-found.tsx"),
    file("app/me/custom/[id]/error.tsx"),
    file("app/me/custom/[id]/loading.tsx"),
    file("next.config.ts")
  ]);

  assert.match(page, /GET as getCustomInquiryApi/);
  assert.match(page, /response\.status === 404\) notFound\(\)/);
  assert.match(page, /cache: "no-store"/);
  assert.match(headers, /source: "\/me\/custom\/:path\*"/);
  assert.match(headers, /private, no-store, max-age=0/);
  assert.match(notFoundPage, /do not have permission/);
  assert.match(errorPage, /Your private information remains protected/);
  assert.match(loadingPage, /aria-busy="true"/);
});

test("Private Custom cards link to the exact encoded owner route and remain keyboard accessible", async () => {
  const profile = await file("app/me/page.tsx");

  assert.match(profile, /href=\{`\/me\/custom\/\$\{encodeURIComponent\(inquiry\.id\)\}`\}/);
  assert.match(profile, /aria-label=\{`Open private Custom inquiry:/);
  assert.match(profile, /focus-visible:ring-2/);
  assert.match(profile, /min-h-20/);
  assert.doesNotMatch(profile, /onClick=.*inquiry\.id/);
});

test("private files use only the existing authorized short-lived access endpoint", async () => {
  const [page, fileRoute] = await Promise.all([
    file("app/me/custom/[id]/page.tsx"),
    file("app/api/community/custom/[id]/files/[index]/route.ts")
  ]);

  assert.match(page, /\/api\/community\/custom\/\$\{encodeURIComponent\(inquiry\.id\)\}\/files\/\$\{index\}/);
  assert.doesNotMatch(page, /supabase\.co|storage\/v1\/object|createPrivateSignedUrl|objectPath|privateFilesJson/);
  assert.match(fileRoute, /createPrivateSignedUrl\(file\.objectPath, 120\)/);
  assert.match(fileRoute, /hasAdminSession\(\)/);
  assert.match(fileRoute, /getCommunitySession\(\)/);
  assert.match(fileRoute, /"Cache-Control": "private, no-store"/);
});

test("hotfix introduces no schema, migration, auth bypass, or Production operation", async () => {
  const sources = await Promise.all([
    file("app/me/page.tsx"),
    file("app/me/custom/[id]/page.tsx"),
    file("app/me/custom/[id]/loading.tsx"),
    file("app/me/custom/[id]/not-found.tsx"),
    file("app/me/custom/[id]/error.tsx"),
    file("app/api/community/custom/[id]/route.ts")
  ]);
  const combined = sources.join("\n");

  assert.doesNotMatch(combined, /prisma\.|DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|migrate|db push|seed/i);
  assert.doesNotMatch(combined, /auth.?bypass|development.?login|client.?controlled.?role/i);
  assert.doesNotMatch(combined, /vercel.*prod|--prod|production deployment/i);
});

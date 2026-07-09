import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../lib/server/community-store.ts", import.meta.url), "utf8");

assert.match(source, /function publicIdeaImageUrls/);
assert.match(source, /\/api\/community\/ideas\/\$\{encodeURIComponent\(slug\)\}\/images\/\$\{index\}/);
assert.match(source, /export async function getCommunityIdeaImage/);

console.log("community image proxy source checks passed");

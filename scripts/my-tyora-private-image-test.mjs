import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const imageRoute = readFileSync(new URL("../app/api/community/ideas/[slug]/images/[index]/route.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../lib/server/community-store.ts", import.meta.url), "utf8");

assert.match(imageRoute, /getCommunitySession/);
assert.match(imageRoute, /viewerId:\s*session\?\.userId/);
assert.match(store, /authorId:\s*true/);
assert.match(store, /viewerId/);
assert.match(store, /canViewPrivate\s*=\s*Boolean\(options\.viewerId\s*&&\s*row\?\.authorId\s*===\s*options\.viewerId\)/);

console.log("My TYORA private idea image checks passed.");

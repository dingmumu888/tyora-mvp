import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const imageRoute = readFileSync(new URL("../app/api/community/private-ideas/[slug]/images/[index]/route.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../lib/server/community-store.ts", import.meta.url), "utf8");

assert.match(imageRoute, /getCurrentIdeaAccessContext/);
assert.match(imageRoute, /"Cache-Control":\s*"private, no-store"/);
assert.match(imageRoute, /status:\s*404/);
assert.doesNotMatch(imageRoute, /public, max-age|NextResponse\.redirect/);
assert.match(store, /authorId:\s*true/);
assert.match(store, /context\.isAdmin/);
assert.match(store, /row\.authorId !== context\.userId/);

console.log("My TYORA private idea image checks passed.");

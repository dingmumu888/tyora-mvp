import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app/build/build-client.tsx", import.meta.url), "utf8");

assert.match(source, /Talk to TYORA <ArrowRight size=\{16\} \/>/);
assert.match(source, /Start from a discussion/);
assert.match(source, /Ready to build your product\?/);

console.log("build CTA source checks passed");

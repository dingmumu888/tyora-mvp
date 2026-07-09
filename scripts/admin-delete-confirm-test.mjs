import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app/admin/community/community-admin-client.tsx", import.meta.url), "utf8");

assert.match(source, /window\.prompt/);
assert.match(source, /Type DELETE to permanently delete/);
assert.match(source, /secondConfirmation !== "DELETE"/);

console.log("admin delete double-confirm source checks passed");

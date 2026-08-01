import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("owner edit dialog exposes all editable idea content", async () => {
  const actions = await readFile(new URL("app/ask/[slug]/idea-actions.tsx", root), "utf8");

  assert.match(actions, /EditableIdeaImages/);
  assert.match(actions, /imageUrls:\s*editImages/);
  assert.match(actions, /country:\s*idea\.country/);
  assert.match(actions, /questions:\s*idea\.questions/);
  assert.match(actions, /otherQuestion:\s*idea\.otherQuestion/);
  assert.match(actions, /communityQuestions\.map/);
  assert.match(actions, /max-h-\[94vh\]/);
  assert.doesNotMatch(actions, />Post type</);
  assert.doesNotMatch(actions, />Product stage</);
});

test("owner update persists editable metadata and republishes immediately", async () => {
  const store = await readFile(new URL("lib/server/community-store.ts", root), "utf8");
  const start = store.indexOf("export async function updateCommunityIdeaOwner");
  const end = store.indexOf("export async function withdrawCommunityIdeaOwner", start);
  const ownerUpdate = store.slice(start, end);

  assert.match(ownerUpdate, /ownerIdeaImageUrls/);
  assert.match(ownerUpdate, /country/);
  assert.match(ownerUpdate, /questionsJson:\s*JSON\.stringify\(questions\)/);
  assert.match(ownerUpdate, /otherQuestion/);
  assert.match(ownerUpdate, /moderationStatus:\s*"Approved"/);
  assert.match(ownerUpdate, /homepageFeatured:\s*false/);
});

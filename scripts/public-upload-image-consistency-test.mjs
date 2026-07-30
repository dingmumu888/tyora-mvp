import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("public product-image uploads share resizing and full-image previews", () => {
  const idea = read("app/ask/new/new-idea-client.tsx");
  const source = read("app/source/source-client.tsx");
  const custom = read("app/custom/custom-inquiry-client.tsx");
  const preview = read("components/public-upload-image-preview.tsx");
  const processing = read("lib/public-image-processing.ts");

  assert.match(idea, /preparePublicImage/);
  assert.match(source, /preparePublicImage/);
  assert.match(custom, /preparePublicImage/);
  assert.match(idea, /PublicUploadImagePreview/);
  assert.match(source, /PublicUploadImagePreview/);
  assert.match(custom, /PublicUploadImagePreview/);
  assert.match(processing, /Math\.min\(1, maxDimension \/ image\.naturalWidth, maxDimension \/ image\.naturalHeight\)/);
  assert.match(processing, /context\.drawImage\(image, 0, 0, canvas\.width, canvas\.height\)/);
  assert.match(preview, /aspect-\[4\/3\]/);
  assert.match(preview, /object-contain/);
  assert.match(preview, /setOpen\(true\)/);
});

test("avatars remain intentionally square and PDFs remain unchanged", () => {
  const avatar = read("components/community-profile-modal.tsx");
  const custom = read("app/custom/custom-inquiry-client.tsx");

  assert.match(avatar, /sourceSize[\s\S]+AVATAR_SIZE/);
  assert.match(custom, /if \(!file\.type\.startsWith\("image\/"\)\) return \{ file, originalName: file\.name \}/);
  assert.match(custom, /PDFs stay unchanged/);
});

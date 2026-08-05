import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("public product-image uploads share resizing and full-image previews", () => {
  const idea = read("app/ask/new/new-idea-client.tsx");
  const source = read("app/source/source-client.tsx");
  const custom = read("app/custom/custom-inquiry-client.tsx");
  const editor = read("components/editable-idea-images.tsx");
  const preview = read("components/public-upload-image-preview.tsx");
  const processing = read("lib/public-image-processing.ts");
  const uploadRoute = read("app/api/community/idea-images/route.ts");
  const uploadToken = read("lib/server/community-image-upload-token.ts");
  const cleanup = read("app/api/cron/source-weekly-cleanup/route.ts");
  const gallery = read("app/ask/[slug]/idea-image-gallery.tsx");
  const avatarViewer = read("components/creator-avatar-viewer.tsx");

  assert.match(idea, /preparePublicImage/);
  assert.match(source, /preparePublicImage/);
  assert.match(custom, /preparePublicImage/);
  assert.match(idea, /EditableIdeaImages/);
  assert.match(source, /PublicUploadImagePreview/);
  assert.match(custom, /PublicUploadImagePreview/);
  assert.match(processing, /Math\.min\(1, maxDimension \/ image\.width, maxDimension \/ image\.height\)/);
  assert.match(processing, /context\.drawImage\(image\.source, 0, 0, canvas\.width, canvas\.height\)/);
  assert.match(processing, /imageOrientation: "from-image"/);
  assert.match(preview, /aspect-\[4\/3\]/);
  assert.match(preview, /object-contain/);
  assert.match(preview, /setOpen\(true\)/);
  assert.match(editor, /preparePublicImage/);
  assert.match(editor, /object-contain/);
  assert.match(editor, /data-image-index/);
  assert.match(editor, /motion\.div/);
  assert.match(editor, /onDragEnter/);
  assert.match(editor, /touchDraggingIndex/);
  assert.match(editor, /reorderHint/);
  assert.match(editor, /setTouchPreview/);
  assert.match(editor, /Math\.min\(3, batch\.length\)/);
  assert.match(editor, /XMLHttpRequest/);
  assert.match(editor, /request\.upload\.onprogress/);
  assert.match(editor, /retryTask/);
  assert.match(processing, /initialMaxDimension = 2048/);
  assert.match(processing, /maxFileSize = 1_500_000/);
  assert.match(processing, /"image\/webp"/);
  assert.match(processing, /hasTransparency/);
  assert.match(uploadRoute, /MAX_IDEA_IMAGE_BYTES = 1_500_000/);
  assert.match(uploadRoute, /sharp\(source/);
  assert.match(uploadRoute, /\.rotate\(\)/);
  assert.match(uploadRoute, /limitInputPixels: 50_000_000/);
  assert.match(uploadRoute, /action: "idea-image-upload"/);
  assert.match(uploadToken, /createHmac\("sha256"/);
  assert.match(cleanup, /cleanupExpiredCommunityImageUploads/);
  assert.match(gallery, /z-\[10050\]/);
  assert.match(avatarViewer, /z-\[10050\]/);
});

test("avatars remain intentionally square and PDFs remain unchanged", () => {
  const avatar = read("components/community-profile-modal.tsx");
  const custom = read("app/custom/custom-inquiry-client.tsx");

  assert.match(avatar, /sourceSize[\s\S]+AVATAR_SIZE/);
  assert.match(custom, /if \(!file\.type\.startsWith\("image\/"\)\) return \{ file, originalName: file\.name \}/);
  assert.match(custom, /PDFs stay unchanged/);
});

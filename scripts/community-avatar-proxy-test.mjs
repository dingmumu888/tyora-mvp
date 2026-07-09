import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const storePath = path.join(root, "lib/server/community-store.ts");
const avatarRoutePath = path.join(root, "app/api/community/users/[userId]/avatar/route.ts");
const avatarComponentPath = path.join(root, "components/community-avatar.tsx");

const store = fs.readFileSync(storePath, "utf8");
const route = fs.existsSync(avatarRoutePath) ? fs.readFileSync(avatarRoutePath, "utf8") : "";
const avatarComponent = fs.readFileSync(avatarComponentPath, "utf8");

const checks = [
  {
    label: "community-store converts stored data avatars into user avatar proxy URLs",
    pass:
      store.includes("function publicCommunityAvatar") &&
      store.includes("/api/community/users/${encodeURIComponent(userId)}/avatar") &&
      store.includes("avatar: publicCommunityAvatar(user.avatar, user.id) || undefined")
  },
  {
    label: "community-store exposes a cached avatar fetch helper",
    pass:
      store.includes("export async function getCommunityUserAvatar") &&
      store.includes("parseStoredDataImage(row.avatar)") &&
      store.includes("redirectUrl")
  },
  {
    label: "avatar API route returns cached image bytes or redirects public avatar URLs",
    pass:
      route.includes("getCommunityUserAvatar") &&
      route.includes("Cache-Control") &&
      route.includes("public, max-age=31536000, immutable") &&
      route.includes("NextResponse.redirect")
  },
  {
    label: "avatar images are lazy loaded in community UI",
    pass: avatarComponent.includes('loading="lazy"')
  }
];

const failed = checks.filter((check) => !check.pass);
if (failed.length) {
  console.error("Community avatar proxy checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("Community avatar proxy checks passed.");

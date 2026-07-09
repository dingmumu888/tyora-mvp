import { readFileSync } from "node:fs";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const communityTypes = readFileSync("lib/community.ts", "utf8");
const store = readFileSync("lib/server/community-store.ts", "utf8");
const adminClient = readFileSync("app/admin/community/community-admin-client.tsx", "utf8");
const homeClient = readFileSync("app/home-client.tsx", "utf8");

const checks = [
  {
    name: "CommunityIdea stores homepage featured flag and order",
    pass:
      schema.includes("homepageFeatured") &&
      schema.includes("homepageFeaturedOrder") &&
      schema.includes("@@index([homepageFeatured")
  },
  {
    name: "CommunityIdea API type exposes homepage featured fields",
    pass:
      communityTypes.includes("homepageFeatured: boolean") &&
      communityTypes.includes("homepageFeaturedOrder?: number")
  },
  {
    name: "store maps featured fields and ranks featured ideas before automatic ideas",
    pass:
      store.includes("homepageFeatured: Boolean(row.homepageFeatured)") &&
      store.includes("homepageFeaturedOrder: typeof row.homepageFeaturedOrder") &&
      store.includes("compareHomepageFeaturedIdeas") &&
      store.includes("Only public ideas can be featured on the homepage.")
  },
  {
    name: "admin can assign homepage feature slots",
    pass:
      adminClient.includes("Homepage #1") &&
      adminClient.includes("homepageFeaturedOrder") &&
      adminClient.includes("Feature on homepage")
  },
  {
    name: "homepage showcase prioritizes manually featured ideas",
    pass:
      homeClient.includes("homepageFeaturedRank") &&
      homeClient.includes("left.homepageFeatured") &&
      homeClient.includes("right.homepageFeatured")
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Homepage featured ideas checks failed:");
  for (const check of failed) console.error(`- ${check.name}`);
  process.exit(1);
}

console.log("Homepage featured ideas checks passed.");

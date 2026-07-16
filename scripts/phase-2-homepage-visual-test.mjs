import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const home = read("app/home-client.tsx");
const storage = read("lib/storage.ts");
const admin = read("components/admin/homepage-content-editor.tsx");
const casesAdmin = read("app/admin/page.tsx");
const mobileTabs = read("components/mobile-bottom-tabs.tsx");
const uploadRoute = read("app/api/media/upload/route.ts");
const failures = [];

function requireCheck(pass, message) {
  if (!pass) failures.push(message);
}

requireCheck(!home.includes("min-h-[calc(100vh-64px)]"), "Legacy full-viewport empty community height remains.");
requireCheck(home.includes("h-[calc(100svh-96px)]") && home.includes("max-h-[620px]"), "Hero does not reserve a visible hint of the next section.");
requireCheck(home.includes("heroCampaign") && home.includes("primaryCtaText"), "CMS campaign and primary CTA are not first-class homepage content.");
requireCheck(home.includes("assessmentPoints") && home.includes("eligibleIdeas") && home.includes("featuredCases"), "Assessment, real ideas, or case fallback is missing.");
requireCheck(home.includes("HomepagePostCard") && home.includes("<CommunityCard") && home.includes("<CaseCard"), "Community ideas and TYORA cases do not share the same card system.");
requireCheck(home.includes("story.badgeLabel") && storage.includes('badgeLabel: "TYORA Case"'), "TYORA Case badge is missing or not CMS-managed.");
requireCheck(!home.includes("/api/community/stats") && !home.includes("sourceRequestCount"), "Homepage still uses activity statistics.");
requireCheck(!home.includes("fixed right-") && !home.includes("mobileDiscussionCtaCollapsed"), "Duplicate application-owned floating controls remain.");
requireCheck(home.includes(">TYORA</") && storage.includes('brandName: "TYORA"'), "TYORA brand is not fixed in Latin characters.");
requireCheck(!/提奥拉|提拉/.test([home, storage, admin, casesAdmin, mobileTabs].join("\n")), "Translated TYORA brand text was found.");
requireCheck(storage.includes("navigationLinks") && storage.includes("communityMinimumScore") && storage.includes("caseLimit"), "CMS navigation, thresholds, or case limit is missing.");
requireCheck(admin.includes("Featured campaigns") && admin.includes("Product categories") && admin.includes("Final production CTA"), "Homepage CMS editor is incomplete.");
requireCheck(casesAdmin.includes("Homepage case cover") && casesAdmin.includes("Card CTA route") && casesAdmin.includes("Featured on homepage"), "TYORA case CMS controls are incomplete.");
requireCheck(uploadRoute.includes('"image/avif"') && !uploadRoute.includes('"image/svg+xml"'), "CMS media MIME policy does not match the safe image workflow.");
requireCheck(
  mobileTabs.includes('{ label: "Home", href: "/"')
    && mobileTabs.includes('{ label: "Ideas", href: "/ask"')
    && mobileTabs.includes('{ label: "Source", href: "/source"')
    && mobileTabs.includes("tabCopy.privateCustom"),
  "Mobile Home, Ideas, Submit, Source, or private Custom path is incomplete."
);

if (failures.length) {
  console.error("Phase 2 homepage visual checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Phase 2 homepage visual checks passed.");

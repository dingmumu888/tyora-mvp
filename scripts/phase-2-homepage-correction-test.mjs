import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const home = read("app/home-client.tsx");
const storage = read("lib/storage.ts");
const admin = read("components/admin/homepage-content-editor.tsx");
const casesAdmin = read("app/admin/page.tsx");
const mobileTabs = read("components/mobile-bottom-tabs.tsx");
const cmsImage = read("components/cms-image.tsx");
const cmsImageField = read("components/admin/cms-image-field.tsx");
const sourceForm = read("app/source/source-client.tsx");
const ideaForm = read("app/ask/new/new-idea-client.tsx");
const homepageDefaultsStart = storage.indexOf("  homepage: {");
const homepageDefaultsEnd = storage.indexOf("  mobileTabs:", homepageDefaultsStart);
const homepageDefaults = storage.slice(homepageDefaultsStart, homepageDefaultsEnd);
const failures = [];

function requireCheck(pass, message) {
  if (!pass) failures.push(message);
}

function categoryEntry(id) {
  const start = storage.indexOf(`id: "${id}"`);
  const next = storage.indexOf("\n      { id:", start + 1);
  if (start < 0) return "";
  return storage.slice(start, next < 0 ? storage.length : next);
}

const visibleCategoryIds = ["phone-accessories", "desktop-office", "custom-gifts"];
const hiddenCategoryIds = ["electronics-accessories", "lifestyle", "fashion-accessories"];

requireCheck(
  storage.includes('id: "fidget-desk-toy-campaign"')
    && storage.includes("active: true")
    && storage.includes('/images/tyora-fidget-campaign-v2.png'),
  "The initial active hot-product campaign is not configured as an editable CMS default."
);
requireCheck(
  admin.includes('Toggle label="Active campaign"')
    && admin.includes("updateCampaign(index, { active })")
    && home.includes("visibleCampaigns.find((campaign) => campaign.active)"),
  "Active campaign selection is not controlled by Admin/CMS."
);

for (const id of visibleCategoryIds) {
  const entry = categoryEntry(id);
  requireCheck(entry.includes("visible: true"), `${id} is not visible by default.`);
  requireCheck(entry.includes("/images/category-"), `${id} does not have a CMS default image.`);
}
for (const id of hiddenCategoryIds) {
  const entry = categoryEntry(id);
  requireCheck(entry.includes("visible: false"), `${id} should remain CMS-managed but hidden by default.`);
}
requireCheck(
  storage.includes("Compliance-sensitive products require separate review."),
  "Homepage category scope does not include the approved compliance note."
);
requireCheck(
  storage.includes('categoriesTitle: "Product Categories TYORA Reviews"')
    && storage.includes('name: "Phone & Device Accessories"')
    && storage.includes('category: "Phone & Device Accessories"'),
  "The approved category terminology is not present in CMS defaults and TYORA case metadata."
);
requireCheck(
  ![homepageDefaults, sourceForm, ideaForm].some((value) => /Phone & 3C Accessories|Phone Accessories|Phone accessories|Initial Product Categories/.test(value)),
  "Legacy public-facing category terminology remains."
);
requireCheck(
  admin.includes("updateCategory(index")
    && admin.includes("Display order")
    && admin.includes("Add Category")
    && admin.includes("CmsImageField"),
  "Category labels, order, visibility, links, or images are not CMS-managed."
);
requireCheck(
  home.includes("grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3")
    && home.includes("TYORA Category")
    && !home.includes("PackageCheck size={25}"),
  "Category cards are not readable on mobile or still use the generic cube fallback."
);

requireCheck(
  home.includes("pb-[calc(8.75rem+env(safe-area-inset-bottom))]")
    && mobileTabs.includes("env(safe-area-inset-bottom)")
    && mobileTabs.includes("min-h-14"),
  "Mobile bottom navigation safety spacing or touch targets are missing."
);
requireCheck(
  storage.includes('profile: "Account"')
    && mobileTabs.includes("<span>{tabCopy.profile}</span>")
    && !mobileTabs.includes('user.name.split(" ")[0]'),
  "The mobile account label can still truncate or be replaced by a user name."
);
requireCheck(
  !home.includes("min-h-52")
    && !home.includes("min-h-56")
    && home.includes("grid-cols-[40px_minmax(0,1fr)]"),
  "Starting-point cards or Source steps still reserve excessive mobile height."
);

requireCheck(
  home.includes("wordSafeExcerpt")
    && home.includes("line-clamp-3")
    && home.includes("<CaseCard story={featuredCases[0]} featured />"),
  "Featured TYORA case prominence or word-safe review clamping is missing."
);
requireCheck(
  casesAdmin.includes("Featured on homepage")
    && casesAdmin.includes("Case badge")
    && casesAdmin.includes('Field label="Project type"'),
  "Featured case selection or case badges are not editable in Admin/CMS."
);

requireCheck(
  cmsImage.includes("getImageProps")
    && cmsImage.includes("<picture>")
    && cmsImage.includes('media="(max-width: 639px)"')
    && home.includes('(max-width: 639px) 100vw'),
  "Homepage images are not using responsive mobile/desktop source selection."
);
requireCheck(
  cmsImageField.includes("CMS image missing. The public page will use the branded fallback."),
  "Admin does not identify a missing CMS image."
);
requireCheck(
  !/<video|autoplay|background-video/i.test([home, homepageDefaults, admin, cmsImage].join("\n")),
  "Video support or autoplay was introduced in the homepage correction."
);
requireCheck(
  !home.includes("/api/community/stats")
    && !home.includes("sourceRequestCount")
    && home.includes("communityEmptyTitle"),
  "Homepage empty data handling may simulate customer activity."
);

for (const image of [
  "public/images/tyora-fidget-campaign-v2.png",
  "public/images/category-phone-3c-accessories-v1.png",
  "public/images/category-desktop-office-v1.png",
  "public/images/category-custom-gifts-v1.png"
]) {
  requireCheck(fs.existsSync(path.join(root, image)), `${image} is missing.`);
}

if (failures.length) {
  console.error("Phase 2 homepage correction checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Phase 2 homepage correction checks passed.");

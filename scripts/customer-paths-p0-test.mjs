import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const home = read("app/home-client.tsx");
const mobileTabs = read("components/mobile-bottom-tabs.tsx");
const search = read("components/site-search.tsx");
const source = read("app/source/source-client.tsx");
const custom = read("app/custom/page.tsx");
const newIdea = read("app/ask/new/new-idea-client.tsx");
const whatsapp = read("lib/whatsapp.ts");

const checks = [
  {
    label: "Homepage featured idea cards open their exact discussion",
    pass: home.includes('href={`/ask/${idea.slug}`}') && !home.includes('key={idea.id} href="/ask"')
  },
  {
    label: "Desktop navigation removes the duplicate Pricing item",
    pass: !home.includes('["Pricing", "/#pricing"]')
  },
  {
    label: "Mobile primary navigation uses Home, Ideas, Submit, Source, and My TYORA",
    pass:
      mobileTabs.includes('{ label: "Home", href: "/"') &&
      mobileTabs.includes('{ label: "Ideas", href: "/ask"') &&
      mobileTabs.includes('{ label: "Source", href: "/source"') &&
      mobileTabs.includes("tabCopy.create") &&
      mobileTabs.includes("tabCopy.profile") &&
      mobileTabs.includes('href="/custom"')
  },
  {
    label: "Site search includes the private Custom path",
    pass:
      search.includes('title: "Private Custom Project"') &&
      search.includes('href: "/custom"')
  },
  {
    label: "Source search anchors point to real page sections",
    pass:
      source.includes('<section id="pricing"') &&
      source.includes('<section id="service-protection"')
  },
  {
    label: "Private Custom CTAs open the prefilled WhatsApp review path",
    pass:
      whatsapp.includes("PRIVATE_CUSTOM_REVIEW_WHATSAPP_URL") &&
      whatsapp.includes("I'd like a private custom product review") &&
      custom.includes("href={PRIVATE_CUSTOM_REVIEW_WHATSAPP_URL}") &&
      source.includes("href={PRIVATE_CUSTOM_REVIEW_WHATSAPP_URL}") &&
      custom.includes("Start Private Review on WhatsApp")
  },
  {
    label: "Idea creation is public-only because private reviews use WhatsApp",
    pass:
      newIdea.includes('visibility: "Public"') &&
      !newIdea.includes("visibilityOptions") &&
      !newIdea.includes("Mobile submission visibility") &&
      !newIdea.includes("Private Custom Project") &&
      !newIdea.includes('searchParams.get("visibility")')
  },
  {
    label: "Product images resize proportionally without center square cropping",
    pass:
      newIdea.includes("PRODUCT_IMAGE_MAX_SIZE") &&
      newIdea.includes("scale = Math.min") &&
      newIdea.includes("image.naturalWidth * scale") &&
      newIdea.includes("image.naturalHeight * scale") &&
      !newIdea.includes("sourceSize = Math.min") &&
      !newIdea.includes("sourceX") &&
      !newIdea.includes("sourceY")
  },
  {
    label: "Upload copy promises proportional resizing instead of cropping",
    pass:
      newIdea.includes("resized without cropping") &&
      !newIdea.includes("auto-cropped to 800 x 800")
  }
];

const failed = checks.filter((check) => !check.pass);
if (failed.length) {
  console.error("Customer path P0 checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("Customer path P0 checks passed.");

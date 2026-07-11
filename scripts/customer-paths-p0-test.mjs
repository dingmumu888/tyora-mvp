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
    label: "Mobile primary navigation uses Custom and supports the Custom route",
    pass:
      mobileTabs.includes('{ label: "Custom", href: "/custom"') &&
      mobileTabs.includes('if (pathname === "/custom") return true') &&
      !mobileTabs.includes('{ label: "Build", href: "/build"')
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
    label: "Custom CTA opens the existing idea form preselected as private",
    pass: custom.includes('href="/ask/new?visibility=private"')
  },
  {
    label: "Idea form reads the requested private visibility",
    pass:
      newIdea.includes("useSearchParams") &&
      newIdea.includes('searchParams.get("visibility") === "private"')
  },
  {
    label: "Mobile quick post exposes an explicit public or private choice",
    pass:
      newIdea.includes("Mobile submission visibility") &&
      newIdea.includes('setForm({ ...form, visibility: option.value })')
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

import { existsSync, readFileSync } from "node:fs";

const source = readFileSync("app/source/source-client.tsx", "utf8");
const sourceRoute = readFileSync("app/api/source/route.ts", "utf8");
const storage = readFileSync("lib/storage.ts", "utf8");
const processPagePath = "app/source/how-it-works/page.tsx";
const processPage = existsSync(processPagePath) ? readFileSync(processPagePath, "utf8") : "";

const checks = [
  {
    name: "source page uses new conversion-focused hero and CTA",
    pass:
      source.includes("Found a product?") &&
      source.includes("Get a free China supplier quote.") &&
      source.includes("Get Free Product Match")
  },
  {
    name: "source page removes supplier checks requested stat",
    pass:
      !source.includes("sourceRequestCount") &&
      !source.includes("Supplier checks requested") &&
      !source.includes("statLabel")
  },
  {
    name: "source form has required category and contact validation",
    pass:
      source.includes("category: string") &&
      source.includes("Please add a category.") &&
      source.includes("Email or WhatsApp")
  },
  {
    name: "category is folded into existing description payload without backend changes",
    pass:
      source.includes("buildSourcePayload") &&
      source.includes("Category: ${form.category}") &&
      source.includes("Description: ${form.description")
  },
  {
    name: "optional fields are collapsed under More details optional",
    pass:
      source.includes("More details (optional)") &&
      source.includes("<details")
  },
  {
    name: "pricing and service protection copy are explicit and short",
    pass:
      source.includes("Supplier Introduction") &&
      source.includes("3%-5% of estimated order value, minimum $199") &&
      source.includes("Managed Sourcing") &&
      source.includes("10%-15% of order value, minimum $499") &&
      source.includes("Service protection") &&
      !source.includes("Simple refund policy")
  },
  {
    name: "sample wording avoids promising free samples",
    pass:
      source.includes("We can help with samples. You only pay sample cost and shipping.")
  },
  {
    name: "mobile top navigation uses shorter Free Match CTA while main CTA stays full",
    pass:
      source.includes("Free Match") &&
      source.includes("<span className=\"sm:hidden\">Free Match</span>") &&
      source.includes("<span className=\"hidden sm:inline\">{ctaText}</span>")
  },
  {
    name: "contact friction is reduced to one Email or WhatsApp field",
    pass:
      source.includes("contact: string") &&
      source.includes("Email or WhatsApp") &&
      source.includes("you@example.com or +1...") &&
      source.includes("mapContactToPayload") &&
      !source.includes("<Field label=\"Email\">") &&
      !source.includes("<Field label=\"WhatsApp\">")
  },
  {
    name: "scary post-CTA disclaimer is moved and softened",
    pass:
      !source.includes("No exact price or supplier is guaranteed before supplier confirmation.") &&
      source.includes("Final price depends on supplier confirmation.")
  },
  {
    name: "mobile pricing has short scan-friendly copy",
    pass:
      source.includes("mobilePrice: \"3%-5%\"") &&
      source.includes("mobileMinimum: \"Minimum $199\"") &&
      source.includes("mobilePrice: \"10%-15%\"") &&
      source.includes("mobileMinimum: \"Minimum $499\"") &&
      source.includes("Based on estimated order value.")
  },
  {
    name: "pricing cards link to full source process anchors",
    pass:
      source.includes("/source/how-it-works#supplier-introduction") &&
      source.includes("/source/how-it-works#managed-sourcing") &&
      source.includes("View full process")
  },
  {
    name: "source page shows anonymized sourcing activity without public replies",
    pass:
      source.includes("Recent anonymized sourcing activity") &&
      source.includes("Buyer details, product links, supplier contacts, and quotes are never shown publicly.") &&
      source.includes("Factory quote sent privately") &&
      source.includes("Supplier options found") &&
      source.includes("Reference sample checking") &&
      !source.includes("TYORA reply:") &&
      !source.includes("Factory: ****") &&
      !source.includes("Price: ****")
  },
  {
    name: "full process page exists with supplier introduction and managed sourcing sections",
    pass:
      processPage.includes("How TYORA Source Works") &&
      processPage.includes("id=\"supplier-introduction\"") &&
      processPage.includes("id=\"managed-sourcing\"")
  },
  {
    name: "full process page explains transparent proof without hidden product markup",
    pass:
      processPage.includes("supplier quote screenshots") &&
      processPage.includes("order payment screenshots") &&
      processPage.includes("relevant order communication records")
  },
  {
    name: "full process page explains reference sample at actual cost and retained matching",
    pass:
      processPage.includes("reference sample") &&
      processPage.includes("actual cost") &&
      processPage.includes("order/customer ID") &&
      processPage.includes("future inspection and reorders")
  },
  {
    name: "source API fills missing destination country from platform country headers",
    pass:
      sourceRoute.includes("withDetectedCountry") &&
      sourceRoute.includes("x-vercel-ip-country") &&
      sourceRoute.includes("cf-ipcountry") &&
      sourceRoute.includes("Not specified") &&
      sourceRoute.includes("Detected country:")
  },
  {
    name: "source trust toast uses visitor copy and slow randomized timing",
    pass:
      source.includes("Checking China supplier options") &&
      source.includes("Exploring factory pricing") &&
      source.includes("Comparing supplier options") &&
      !source.includes("Supplier check activity") &&
      storage.includes("United States buyer viewed Source") &&
      storage.includes("Germany buyer viewed Source") &&
      storage.includes("United Kingdom buyer viewed Source") &&
      storage.includes("trustToastMinSeconds: 60") &&
      storage.includes("trustToastMaxSeconds: 300") &&
      !storage.includes("Someone requested a supplier check") &&
      !storage.includes("A new product sourcing request was submitted")
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Source conversion page checks failed:");
  for (const check of failed) console.error(`- ${check.name}`);
  process.exit(1);
}

console.log("Source conversion page checks passed.");

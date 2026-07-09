import { readFileSync } from "node:fs";

const source = readFileSync("app/source/source-client.tsx", "utf8");

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
    name: "pricing and refund policy are explicit and short",
    pass:
      source.includes("Supplier Introduction") &&
      source.includes("3%-5% of estimated order value, minimum $199") &&
      source.includes("Managed Sourcing") &&
      source.includes("10%-15% of order value, minimum $499") &&
      source.includes("Simple refund policy")
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
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Source conversion page checks failed:");
  for (const check of failed) console.error(`- ${check.name}`);
  process.exit(1);
}

console.log("Source conversion page checks passed.");

import { existsSync, readFileSync } from "node:fs";

function read(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const source = read("app/source/source-client.tsx");
const whatsappInput = read("components/whatsapp-number-input.tsx");
const sourceContact = read("lib/source-contact.ts");
const countryCodes = read("lib/country-calling-codes.ts");
const countryRoute = read("app/api/source/country/route.ts");
const sourceStore = read("lib/server/source-store.ts");

const checks = [
  {
    name: "source form renders separate email and WhatsApp fields",
    pass:
      source.includes('<Field label="Email">') &&
      source.includes('label="WhatsApp"') &&
      !source.includes('<Field label="Email or WhatsApp">')
  },
  {
    name: "source form requires at least one contact method",
    pass:
      source.includes("Please add an email address or WhatsApp number.") &&
      source.includes('<form id="source-form" noValidate')
  },
  {
    name: "WhatsApp selector supports searchable country calling codes",
    pass:
      whatsappInput.includes("Search country or +code") &&
      whatsappInput.includes("countryCallingCodes") &&
      whatsappInput.includes('role="listbox"') &&
      countryCodes.includes('dialCode: "+86"') &&
      countryCodes.includes('dialCode: "+1"')
  },
  {
    name: "visitor country selects a default calling code with a +1 fallback",
    pass:
      countryRoute.includes("getDetectedCountry") &&
      source.includes('fetch("/api/source/country"') &&
      countryCodes.includes("callingCodeForCountry") &&
      countryCodes.includes('iso: "US"')
  },
  {
    name: "WhatsApp numbers and optional product links are normalized",
    pass:
      sourceContact.includes("normalizeWhatsAppNumber") &&
      sourceContact.includes("normalizeOptionalProductLink") &&
      sourceContact.includes('`https://${trimmed}`')
  },
  {
    name: "product link is presented as an equal alternative to image upload",
    pass:
      source.includes('<Field label="Product link or image">') &&
      source.includes("Paste a product page link, or leave this blank and upload at least one image below.") &&
      source.includes("Optional if you added a product link")
  },
  {
    name: "server requires either a valid product link or a valid image",
    pass:
      sourceStore.includes("sanitizeOptionalProductLink") &&
      sourceStore.includes("sourceImageUrls(data).length === 0 && !productLink") &&
      sourceStore.includes("Add a valid product link or upload a valid product image.")
  },
  {
    name: "client requires either a valid product link or an uploaded image",
    pass:
      source.includes("form.imageUrls.length === 0 && !productLink.value") &&
      source.includes("Please add a product link or upload a product image.")
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Source contact form checks failed:");
  for (const check of failed) console.error(`- ${check.name}`);
  process.exit(1);
}

console.log("Source contact form checks passed.");

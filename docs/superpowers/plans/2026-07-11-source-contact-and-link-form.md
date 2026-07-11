# Source Contact and Product Link Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Source buyers submit with email, WhatsApp, or both; provide a searchable IP-defaulted country-code selector; and prevent optional product-link mistakes from blocking submission.

**Architecture:** Put country dialing data and normalization in focused shared modules, expose a small public endpoint that returns only the platform-detected country code, and keep the visual selector in a reusable client component. The Source client normalizes and warns before submission while the server independently sanitizes optional contact and link values for defense in depth.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.8, Tailwind CSS 4, existing Node `.mjs` checks, Prisma.

## Global Constraints

- Do not add a third-party dependency.
- Email and WhatsApp are separate fields; at least one valid contact method is required.
- Product link is optional and can never block an otherwise valid submission.
- The visitor IP is not stored or displayed; platform country headers only select an initial dialing code.
- Unknown countries default to `+1`, and the buyer can always change the selection.
- Preserve the existing Source pricing, content, database schema, image flow, and admin workflow.

---

### Task 1: Lock The New Form Contract With A Failing Test

**Files:**
- Create: `scripts/source-contact-form-test.mjs`
- Modify: `scripts/source-conversion-page-test.mjs`

**Interfaces:**
- Consumes: existing Source client, Source API route, and Source store files as text fixtures.
- Produces: a regression command that enforces the new field, selector, normalization, endpoint, and server-tolerance contracts.

- [ ] **Step 1: Write the failing regression test**

Create `scripts/source-contact-form-test.mjs` using `readFileSync` and checks for these exact contracts:

```js
const checks = [
  ["separate contact fields", source.includes('<Field label="Email">') && source.includes('label="WhatsApp"')],
  ["at least one contact", source.includes("Please add an email address or WhatsApp number.")],
  ["searchable selector", whatsappInput.includes("Search country or +code") && whatsappInput.includes("countryCallingCodes")],
  ["IP default", countryRoute.includes("getDetectedCountry") && source.includes('/api/source/country')],
  ["link helper", source.includes("Optional. Paste a product page link")],
  ["link normalization", sourceContact.includes("normalizeOptionalProductLink")],
  ["invalid optional link tolerated", sourceStore.includes("sanitizeOptionalProductLink")]
];
```

Update the old combined-contact assertion in `source-conversion-page-test.mjs` to expect separate fields and no `mapContactToPayload`.

- [ ] **Step 2: Run the test and verify RED**

Run: `node scripts/source-contact-form-test.mjs`

Expected: FAIL listing all new contracts because the selector, helpers, and country endpoint do not exist.

- [ ] **Step 3: Commit the failing contract**

```bash
git add scripts/source-contact-form-test.mjs scripts/source-conversion-page-test.mjs
git commit -m "test: define source contact form behavior"
```

---

### Task 2: Add Shared Country And Normalization Logic

**Files:**
- Create: `lib/country-calling-codes.ts`
- Create: `lib/source-contact.ts`
- Create: `app/api/source/country/route.ts`
- Modify: `app/api/source/route.ts`

**Interfaces:**
- Produces: `CountryCallingCode`, `countryCallingCodes`, `callingCodeForCountry(countryCode)`, `normalizeWhatsAppNumber(dialCode, localNumber)`, `normalizeOptionalProductLink(value)`, and `sanitizeOptionalProductLink(value)`.
- Produces: public `GET /api/source/country` returning `{ success: true, data: { countryCode } }`.
- Consumes: existing platform country headers `x-vercel-ip-country`, `cf-ipcountry`, `x-country-code`, and `x-ip-country`.

- [ ] **Step 1: Implement country data and pure helpers**

Use this shape for each supported country:

```ts
export type CountryCallingCode = {
  iso: string;
  name: string;
  aliases?: string[];
  dialCode: string;
  flag: string;
};
```

Include international destinations across North America, South America, Europe, Asia, Africa, and Oceania. `callingCodeForCountry` must fall back to the United States entry.

Implement normalization contracts:

```ts
export function normalizeWhatsAppNumber(dialCode: string, localNumber: string) {
  const trimmed = localNumber.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  const digits = trimmed.replace(/\D/g, "").replace(/^0+/, "");
  return digits ? `${dialCode}${digits}` : "";
}

export function normalizeOptionalProductLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { value: "", omittedInvalid: false };
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (!url.hostname.includes(".")) throw new Error("invalid host");
    return { value: url.toString(), omittedInvalid: false };
  } catch {
    return { value: "", omittedInvalid: true };
  }
}
```

`sanitizeOptionalProductLink` accepts `unknown` and returns only the normalized string.

- [ ] **Step 2: Extract country-header detection and add the public endpoint**

Move country-header reading to a shared server helper or export it from a focused server module. The country endpoint returns the ISO code only and must not require admin authentication.

- [ ] **Step 3: Run the focused test**

Run: `node scripts/source-contact-form-test.mjs`

Expected: country data, endpoint, and normalization checks pass; visual form checks remain failing.

- [ ] **Step 4: Commit shared behavior**

```bash
git add lib/country-calling-codes.ts lib/source-contact.ts app/api/source/country/route.ts app/api/source/route.ts
git commit -m "feat: add source contact normalization"
```

---

### Task 3: Build The WhatsApp Selector And Update The Source Form

**Files:**
- Create: `components/whatsapp-number-input.tsx`
- Modify: `app/source/source-client.tsx`

**Interfaces:**
- Consumes: `countryCallingCodes`, `callingCodeForCountry`, `normalizeWhatsAppNumber`, and `normalizeOptionalProductLink`.
- Produces: `WhatsAppNumberInput` with props `{ countryIso, localNumber, onCountryChange, onLocalNumberChange }`.
- Produces: Source payload fields `email` and normalized `whatsapp` using the existing API contract.

- [ ] **Step 1: Implement the searchable selector**

The component must:

```tsx
<button type="button" aria-expanded={open} aria-haspopup="listbox">
  <span>{selected.flag}</span><span>{selected.dialCode}</span><ChevronDown />
</button>
```

When open, render a search input with placeholder `Search country or +code` and filter by normalized ISO, English name, aliases, and dialing code. Close on selection, outside click, and Escape. Keep the number input separate with `inputMode="tel"` and placeholder `WhatsApp number`.

- [ ] **Step 2: Replace the combined contact field**

Change form state from `contact` to:

```ts
email: string;
whatsappCountryIso: string;
whatsappLocalNumber: string;
```

On mount, fetch `/api/source/country` and apply its ISO code only while the buyer has not manually changed the selector. Render Email and WhatsApp as separate labeled controls.

- [ ] **Step 3: Normalize optional values during submission**

Build the payload with trimmed email, normalized WhatsApp, and normalized product link. Validate at least one usable contact method. If the product link is omitted as invalid, complete submission and show: `Your request was submitted. The product link was not saved because its format was invalid.`

- [ ] **Step 4: Add product-link guidance**

Below Product link render:

```tsx
<p className="mt-1 text-xs leading-5 text-[#69707d]">
  Optional. Paste a product page link, for example https://www.1688.com/...
</p>
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
node scripts/source-contact-form-test.mjs
node scripts/source-conversion-page-test.mjs
```

Expected: both commands print their pass messages and exit 0.

- [ ] **Step 6: Commit the form UI**

```bash
git add components/whatsapp-number-input.tsx app/source/source-client.tsx scripts/source-contact-form-test.mjs scripts/source-conversion-page-test.mjs
git commit -m "feat: improve source contact form"
```

---

### Task 4: Make Server Validation Non-Blocking For Optional Fields

**Files:**
- Modify: `lib/server/source-store.ts`
- Modify: `scripts/source-contact-form-test.mjs`

**Interfaces:**
- Consumes: `sanitizeOptionalProductLink` from `lib/source-contact.ts`.
- Produces: Source records where invalid optional links are stored as `null` instead of rejecting the request.

- [ ] **Step 1: Extend the failing server contract**

Require the store to call `sanitizeOptionalProductLink(data.productLink)` and remove the old blocking `Product link must start` validation branch.

- [ ] **Step 2: Run the test and verify RED**

Run: `node scripts/source-contact-form-test.mjs`

Expected: FAIL only on the server sanitization contract.

- [ ] **Step 3: Implement minimal server sanitization**

In validation, stop rejecting malformed optional links. Before Prisma creation:

```ts
const productLink = sanitizeOptionalProductLink(data.productLink);
```

Store `productLink || null`. Keep the existing rule that at least one of `email` or `whatsapp` must be present.

- [ ] **Step 4: Run focused tests and build**

Run:

```bash
node scripts/source-contact-form-test.mjs
node scripts/source-conversion-page-test.mjs
npm run build
```

Expected: both test scripts pass; Next.js production build and security scan exit 0.

- [ ] **Step 5: Commit server tolerance**

```bash
git add lib/server/source-store.ts scripts/source-contact-form-test.mjs
git commit -m "fix: tolerate optional source link errors"
```

---

### Task 5: Deploy And Verify Production

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes: commits from Tasks 1-4.
- Produces: deployed `/source` and `/api/source/country` behavior on `www.tyora.io`.

- [ ] **Step 1: Review the final diff and repository state**

Run: `git status --short` and `git log -6 --oneline`

Expected: no unintended files and all feature commits present.

- [ ] **Step 2: Push deployment**

Run: `git push origin main`

Expected: remote `main` advances and Vercel deployment starts.

- [ ] **Step 3: Verify live endpoints**

Check that `https://www.tyora.io/source` returns 200 and contains the new Email, WhatsApp, searchable country-code, and product-link helper contracts. Check that `https://www.tyora.io/api/source/country` returns 200 with a country code.

- [ ] **Step 4: Verify desktop and mobile layout**

Use browser screenshots at a desktop viewport and a narrow mobile viewport. Confirm fields do not overlap, the selector opens and searches `+86`, and the optional-link helper remains legible.

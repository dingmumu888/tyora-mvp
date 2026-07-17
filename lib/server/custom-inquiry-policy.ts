const customInquiryStatuses = ["Submitted", "In Review", "Need Information", "Qualified", "Closed"] as const;
type CustomInquiryStatus = (typeof customInquiryStatuses)[number];

export type CustomInquiryAccessRecord = {
  userId: string;
};

export type CustomInquiryAccessContext = {
  userId?: string | null;
  isAdmin?: boolean;
};

export class CustomInquiryNotFoundError extends Error {
  constructor() {
    super("Custom inquiry not found.");
    this.name = "CustomInquiryNotFoundError";
  }
}

export function canReadCustomInquiry(
  inquiry: CustomInquiryAccessRecord,
  context: CustomInquiryAccessContext = {}
) {
  return Boolean(context.isAdmin || context.userId && context.userId === inquiry.userId);
}

export function assertCanReadCustomInquiry<T extends CustomInquiryAccessRecord>(
  inquiry: T | null | undefined,
  context: CustomInquiryAccessContext = {}
): asserts inquiry is T {
  if (!inquiry || !canReadCustomInquiry(inquiry, context)) throw new CustomInquiryNotFoundError();
}

export function normalizeCustomInquiryStatus(value: unknown): CustomInquiryStatus {
  return customInquiryStatuses.includes(value as CustomInquiryStatus)
    ? value as CustomInquiryStatus
    : "Submitted";
}

const allowedCustomerFields = new Set([
  "ideaSlug",
  "productName",
  "productDescription",
  "category",
  "quantity",
  "budget",
  "targetMarket",
  "timeline",
  "contactEmail",
  "contactWhatsapp"
]);

function textValue(data: Record<string, unknown>, key: string, maxLength: number) {
  const value = data[key];
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new Error(`${key} must be text.`);
  return value.trim().slice(0, maxLength);
}

export function parseCustomInquirySubmission(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid Custom inquiry.");
  }
  const data = input as Record<string, unknown>;
  const unexpected = Object.keys(data).filter((key) => !allowedCustomerFields.has(key));
  if (unexpected.length) throw new Error("Invalid Custom inquiry fields.");

  const contactEmail = textValue(data, "contactEmail", 320).toLowerCase();
  const contactWhatsapp = textValue(data, "contactWhatsapp", 80);
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error("Enter a valid contact email.");
  }
  if (contactWhatsapp && !/^\+?[0-9 ()-]{6,30}$/.test(contactWhatsapp)) {
    throw new Error("Enter a valid WhatsApp number.");
  }

  return {
    ideaSlug: textValue(data, "ideaSlug", 220),
    productName: textValue(data, "productName", 180),
    productDescription: textValue(data, "productDescription", 6000),
    category: textValue(data, "category", 160),
    quantity: textValue(data, "quantity", 120),
    budget: textValue(data, "budget", 160),
    targetMarket: textValue(data, "targetMarket", 180),
    timeline: textValue(data, "timeline", 180),
    contactEmail,
    contactWhatsapp
  };
}

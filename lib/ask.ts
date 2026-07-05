export const ASK_STATUSES = ["Waiting", "Answered", "Project Started", "Completed"] as const;

export type AskStatus = (typeof ASK_STATUSES)[number];
export type AskVisibility = "Public" | "Private";

export type AskQuestion =
  | "Can this be manufactured?"
  | "Estimated manufacturing cost?"
  | "Material recommendation?"
  | "MOQ estimate?"
  | "Factory recommendation?"
  | "Other";

export type AskDiscussionItem = {
  id: string;
  name: string;
  body: string;
  createdAt: string;
};

export type AskIdea = {
  id: string;
  slug: string;
  productName: string;
  category: string;
  country: string;
  description: string;
  imageNames: string[];
  questions: AskQuestion[];
  otherQuestion?: string;
  email: string;
  whatsapp?: string;
  visibility: AskVisibility;
  status: AskStatus;
  expertReview?: string;
  discussion: AskDiscussionItem[];
  createdAt: string;
  updatedAt: string;
};

export const askQuestionOptions: AskQuestion[] = [
  "Can this be manufactured?",
  "Estimated manufacturing cost?",
  "Material recommendation?",
  "MOQ estimate?",
  "Factory recommendation?",
  "Other"
];

export function makeAskId() {
  return `ASK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function slugifyIdea(productName: string, id: string) {
  const base = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
  return `${base || "idea"}-${id.toLowerCase()}`;
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function stringArray(value: unknown, limit = 20) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, limit)
    : [];
}

export function normalizeAskIdea(value: unknown): AskIdea {
  const source = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const id = stringValue(source.id) || makeAskId();
  const productName = stringValue(source.productName, "Untitled Product").slice(0, 120);
  const now = new Date().toISOString();
  const questions = stringArray(source.questions, 6).filter((item): item is AskQuestion =>
    askQuestionOptions.includes(item as AskQuestion)
  );
  const status = ASK_STATUSES.includes(source.status as AskStatus) ? (source.status as AskStatus) : "Waiting";
  const visibility = source.visibility === "Private" ? "Private" : "Public";

  return {
    id,
    slug: stringValue(source.slug) || slugifyIdea(productName, id),
    productName,
    category: stringValue(source.category).slice(0, 120),
    country: stringValue(source.country).slice(0, 120),
    description: stringValue(source.description).slice(0, 3000),
    imageNames: stringArray(source.imageNames, 5),
    questions,
    otherQuestion: stringValue(source.otherQuestion).slice(0, 500) || undefined,
    email: stringValue(source.email).slice(0, 254),
    whatsapp: stringValue(source.whatsapp).slice(0, 80) || undefined,
    visibility,
    status,
    expertReview: stringValue(source.expertReview).slice(0, 5000) || undefined,
    discussion: Array.isArray(source.discussion) ? source.discussion.map(normalizeDiscussionItem).slice(0, 200) : [],
    createdAt: stringValue(source.createdAt, now),
    updatedAt: stringValue(source.updatedAt, now)
  };
}

export function normalizeDiscussionItem(value: unknown): AskDiscussionItem {
  const source = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return {
    id: stringValue(source.id) || makeAskId(),
    name: stringValue(source.name, "Founder").slice(0, 80),
    body: stringValue(source.body).slice(0, 1200),
    createdAt: stringValue(source.createdAt, new Date().toISOString())
  };
}

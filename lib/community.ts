export const communityStatuses = [
  "Discussing",
  "TYORA Reviewing",
  "Project Started",
  "Manufacturing",
  "Shipping",
  "Completed"
] as const;

export const communityQuestions = [
  "Can this be manufactured?",
  "Estimated Cost?",
  "Material Suggestion?",
  "MOQ Estimate?",
  "Factory Recommendation?",
  "Other"
] as const;

export type CommunityStatus = (typeof communityStatuses)[number];
export type CommunityVisibility = "Public" | "Private";
export type CommunityQuestion = (typeof communityQuestions)[number];

export type CommunityUser = {
  id: string;
  googleId?: string;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  profileCompleted: boolean;
  country?: string;
  joinedAt: string;
};

export type CommunityComment = {
  id: string;
  body: string;
  hidden: boolean;
  parentId?: string;
  author: Pick<CommunityUser, "id" | "username" | "name" | "avatar" | "country">;
  likeCount: number;
  viewerLiked?: boolean;
  createdAt: string;
};

export type TyoraReview = {
  id: string;
  manufacturingFeasible?: string;
  estimatedCostRange?: string;
  suggestedMaterial?: string;
  estimatedMoq?: string;
  suggestedManufacturing?: string;
  factoriesMatched?: string;
  additionalNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityIdea = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  country: string;
  imageUrls: string[];
  questions: CommunityQuestion[];
  otherQuestion?: string;
  visibility: CommunityVisibility;
  status: CommunityStatus;
  hidden: boolean;
  locked: boolean;
  pinned: boolean;
  homepageFeatured: boolean;
  homepageFeaturedOrder?: number;
  author: Pick<CommunityUser, "id" | "username" | "name" | "avatar" | "country">;
  comments: CommunityComment[];
  review?: TyoraReview;
  likeCount: number;
  interestedCount: number;
  hotScore: number;
  isHot: boolean;
  hotUntil?: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityFeedSort =
  | "newest"
  | "trending"
  | "recently-active"
  | "latest-tyora-reply"
  | "latest-comments"
  | "latest-uploaded";

export function makeCommunityId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function slugifyCommunityIdea(title: string, id: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);
  return `${base || "idea"}-${id.toLowerCase()}`;
}

export function usernameFromEmail(email: string) {
  const base = email.split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
  return base || `creator-${Date.now().toString(36)}`;
}

export function normalizeStatus(value: unknown): CommunityStatus {
  return communityStatuses.includes(value as CommunityStatus) ? (value as CommunityStatus) : "Discussing";
}

export function normalizeVisibility(value: unknown): CommunityVisibility {
  return value === "Private" ? "Private" : "Public";
}

export function normalizeQuestions(value: unknown): CommunityQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is CommunityQuestion => communityQuestions.includes(item as CommunityQuestion))
    .slice(0, 6);
}

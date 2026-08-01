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

export const communityPostTypes = [
  "Idea Feedback",
  "Design Feedback",
  "Manufacturing Advice",
  "Cost & MOQ",
  "Progress Update"
] as const;

export const communityProductStages = [
  "Concept",
  "Design",
  "Prototype",
  "Pre-production",
  "Production"
] as const;

export const customInquiryStatuses = ["Submitted", "In Review", "Need Information", "Qualified", "Closed"] as const;

export type CommunityStatus = (typeof communityStatuses)[number];
export type CommunityModerationStatus = "Pending" | "Approved" | "Returned" | "Removed" | "Rejected" | "Draft";
export type CommunityVisibility = "Public" | "Private";
export type CommunityQuestion = (typeof communityQuestions)[number];
export type CommunityPostType = (typeof communityPostTypes)[number];
export type CommunityProductStage = (typeof communityProductStages)[number];
export type CustomInquiryStatus = (typeof customInquiryStatuses)[number];

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
  countryCode?: string;
  industry?: string;
  occupation?: string;
  expertRole?: string;
  expertVerified: boolean;
  joinedAt: string;
};

export type CommunityComment = {
  id: string;
  body: string;
  hidden: boolean;
  parentId?: string;
  author: Pick<CommunityUser, "id" | "username" | "name" | "avatar" | "country" | "countryCode" | "industry" | "occupation" | "expertRole" | "expertVerified">;
  likeCount: number;
  viewerLiked?: boolean;
  helpfulCount: number;
  viewerHelpful?: boolean;
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
  moldRequirement?: string;
  assumptions?: string;
  confidence?: string;
  assessmentStatus: "Draft" | "Published";
  disclaimer: string;
  mainRisks?: string;
  recommendedNextStep?: string;
  customEligible: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityIdea = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  postType: CommunityPostType;
  productStage: CommunityProductStage;
  country: string;
  imageUrls: string[];
  questions: CommunityQuestion[];
  otherQuestion?: string;
  visibility: CommunityVisibility;
  moderationStatus: CommunityModerationStatus;
  status: CommunityStatus;
  hidden: boolean;
  locked: boolean;
  pinned: boolean;
  homepageFeatured: boolean;
  homepageFeaturedOrder?: number;
  publicConsentAt?: string;
  publicConsentVersion?: string;
  publicConsentLocale?: string;
  moderatedAt?: string;
  moderationNote?: string;
  author: Pick<CommunityUser, "id" | "username" | "name" | "avatar" | "country" | "countryCode" | "industry" | "occupation" | "expertRole" | "expertVerified">;
  comments: CommunityComment[];
  review?: TyoraReview;
  likeCount: number;
  helpfulCount: number;
  interestedCount: number;
  shareCount: number;
  reportCount?: number;
  reportReasons?: string[];
  hotScore: number;
  isHot: boolean;
  hotUntil?: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomInquiry = {
  id: string;
  ideaId?: string;
  productName: string;
  productDescription: string;
  category: string;
  quantity: string;
  budget: string;
  targetMarket: string;
  timeline: string;
  contactEmail?: string;
  contactWhatsapp?: string;
  fileCount: number;
  status: string;
  nextStep?: string;
  ideaSnapshot?: {
    id: string;
    slug?: string;
    title?: string;
    category?: string;
  };
  assessmentSnapshot?: Partial<TyoraReview>;
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

export function normalizeCommunityPostType(value: unknown): CommunityPostType {
  return communityPostTypes.includes(value as CommunityPostType)
    ? (value as CommunityPostType)
    : "Idea Feedback";
}

export function normalizeCommunityProductStage(value: unknown): CommunityProductStage {
  return communityProductStages.includes(value as CommunityProductStage)
    ? (value as CommunityProductStage)
    : "Concept";
}

export function normalizeQuestions(value: unknown): CommunityQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is CommunityQuestion => communityQuestions.includes(item as CommunityQuestion))
    .slice(0, 6);
}

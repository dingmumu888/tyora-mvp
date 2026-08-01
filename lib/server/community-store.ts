import {
  CommunityFeedSort,
  CommunityIdea,
  CommunityUser,
  makeCommunityId,
  normalizeCommunityPostType,
  normalizeCommunityProductStage,
  normalizeQuestions,
  normalizeStatus,
  normalizeVisibility,
  slugifyCommunityIdea,
  usernameFromEmail
} from "@/lib/community";
import { prisma } from "@/lib/server/db";
import { getContent } from "@/lib/server/data-store";
import { executeGuardedCommunityAction } from "@/lib/server/community-action-guard";
import { defaultContent } from "@/lib/storage";
import type { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import {
  assertCanInteractWithIdea,
  assertCanReadIdea,
  IdeaAccessContext,
  IdeaNotFoundError,
  isApprovedPublicIdea,
  normalizeIdeaModerationStatus
} from "@/lib/server/idea-access-policy";
import {
  buildPrivateIdeaObjectPath,
  validatePrivateUploadBytes
} from "@/lib/server/private-storage-policy";
import { deletePrivateObject, uploadPrivateObject } from "@/lib/server/private-storage";
import {
  isProfileIndustry,
  profileCountryFromCode
} from "@/lib/profile-options";

type UserRow = {
  id: string;
  googleId: string | null;
  email: string;
  username: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  profileCompleted: boolean;
  country: string | null;
  countryCode: string | null;
  industry: string | null;
  occupation: string | null;
  expertRole: string | null;
  expertVerified: boolean;
  lastNotificationSeenAt?: Date | null;
  joinedAt: Date;
};

const MAX_INLINE_IDEA_IMAGE_LENGTH = 900000;
const MAX_INLINE_AVATAR_LENGTH = 120000;
const DATA_IMAGE_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=\s]+)$/;

type CommunityRankingConfig = Pick<
  typeof defaultContent.communityPage,
  "hotWindowDays" | "hotProtectionHours" | "hotScoreThreshold"
>;

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function safePublicImageUrl(value: unknown, maxInlineLength = MAX_INLINE_IDEA_IMAGE_LENGTH) {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url) return null;
  if (url.startsWith("data:image/")) {
    return url.length <= maxInlineLength && url.includes(";base64,") ? url : null;
  }
  if (url.startsWith("https://") || url.startsWith("http://") || url.startsWith("/")) return url.slice(0, 2048);
  return null;
}

function storedIdeaImageUrls(value: unknown) {
  const parsed = parseJson<unknown[]>(value, []);
  return Array.isArray(parsed)
    ? parsed
        .map((item) => {
          if (typeof item !== "string") return null;
          const stored = item.trim();
          if (stored.startsWith("private:idea-submissions/")) return stored;
          return safePublicImageUrl(stored);
        })
        .filter((item): item is string => Boolean(item))
        .slice(0, 9)
    : [];
}

function ideaImageUrls(value: unknown, slug: string, privateAccess: boolean) {
  const parsed = parseJson<unknown[]>(value, []);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item, index) => {
      if (typeof item !== "string") return null;
      const url = item.trim();
      if (!url) return null;
      if (url.startsWith("private:idea-submissions/")) {
        const segment = privateAccess ? "private-ideas" : "ideas";
        return `/api/community/${segment}/${encodeURIComponent(slug)}/images/${index}`;
      }
      if (privateAccess) {
        if (DATA_IMAGE_PATTERN.test(url)) {
          return `/api/community/private-ideas/${encodeURIComponent(slug)}/images/${index}`;
        }
        return null;
      }
      if (DATA_IMAGE_PATTERN.test(url)) {
        return `/api/community/ideas/${encodeURIComponent(slug)}/images/${index}`;
      }
      return safePublicImageUrl(url);
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, 9);
}

function parseStoredDataImage(value: unknown) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(DATA_IMAGE_PATTERN);
  if (!match) return null;
  try {
    return {
      contentType: match[1],
      body: Buffer.from(match[2].replace(/\s/g, ""), "base64")
    };
  } catch {
    return null;
  }
}

function privateImageExtension(contentType: string) {
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/png") return ".png";
  if (contentType === "image/webp") return ".webp";
  return "";
}

async function storePrivateIdeaImages(values: string[]) {
  const stored: string[] = [];
  for (const value of values) {
    const image = parseStoredDataImage(value);
    const extension = image ? privateImageExtension(image.contentType) : "";
    if (!image || !extension) {
      throw new Error("Private idea images must be JPG, PNG, or WebP files.");
    }
    validatePrivateUploadBytes({
      displayName: `idea${extension}`,
      mimeType: image.contentType,
      size: image.body.byteLength,
      header: new Uint8Array(
        image.body.buffer,
        image.body.byteOffset,
        Math.min(16, image.body.byteLength)
      )
    });
    const objectPath = buildPrivateIdeaObjectPath(extension);
    const bytes = image.body.buffer.slice(
      image.body.byteOffset,
      image.body.byteOffset + image.body.byteLength
    ) as ArrayBuffer;
    await uploadPrivateObject(objectPath, bytes, image.contentType);
    stored.push(`private:${objectPath}`);
  }
  return stored;
}

function storedImageIndexFromProxy(value: string, slug: string) {
  if (!value.startsWith("/api/community/")) return null;
  let parsed: URL;
  try {
    parsed = new URL(value, "https://private-images.tyora.invalid");
  } catch {
    return null;
  }
  if (
    parsed.origin !== "https://private-images.tyora.invalid" ||
    parsed.search ||
    parsed.hash
  ) {
    return null;
  }
  const match = parsed.pathname.match(
    /^\/api\/community\/(?:ideas|private-ideas)\/([^/]+)\/images\/([0-8])$/
  );
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]) === slug ? Number(match[2]) : null;
  } catch {
    return null;
  }
}

async function ownerIdeaImageUrls(input: unknown[], existingValue: unknown, slug: string) {
  const existing = storedIdeaImageUrls(existingValue);
  const next: string[] = [];
  for (const item of input.slice(0, 9)) {
    if (typeof item !== "string") throw new Error("Invalid idea image.");
    const value = item.trim();
    const existingIndex = storedImageIndexFromProxy(value, slug);
    if (existingIndex !== null && existing[existingIndex]) {
      next.push(existing[existingIndex]);
      continue;
    }
    if (existing.includes(value)) {
      next.push(value);
      continue;
    }
    const dataImage = safePublicImageUrl(value);
    if (dataImage?.startsWith("data:image/")) {
      next.push(...await storePrivateIdeaImages([dataImage]));
      continue;
    }
    throw new Error("Invalid idea image.");
  }
  return next;
}

function publicCommunityAvatar(value: unknown, userId: string) {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url) return null;
  if (DATA_IMAGE_PATTERN.test(url)) {
    const version = createHash("sha256").update(url).digest("hex").slice(0, 12);
    return `/api/community/users/${encodeURIComponent(userId)}/avatar?v=${version}`;
  }
  return safePublicImageUrl(url, MAX_INLINE_AVATAR_LENGTH);
}

function iso(value: Date | string | null | undefined) {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : value;
}

function hotSignals(
  row: any,
  config: CommunityRankingConfig = defaultContent.communityPage
) {
  const now = Date.now();
  const since = now - config.hotWindowDays * 24 * 60 * 60 * 1000;
  const reactions = Array.isArray(row.reactions) ? row.reactions : [];
  const comments = Array.isArray(row.comments) ? row.comments.filter((comment: any) => !comment.hidden) : [];
  const recentLikes = reactions.filter((reaction: any) => ["Helpful", "Like"].includes(reaction.type) && new Date(reaction.createdAt).getTime() >= since);
  const recentInterested = reactions.filter((reaction: any) => reaction.type === "Interested" && new Date(reaction.createdAt).getTime() >= since);
  const recentComments = comments.filter((comment: any) => new Date(comment.createdAt).getTime() >= since);
  const score = recentLikes.length * 2 + recentComments.length * 3 + recentInterested.length * 4;
  const latestSignalAt = [...recentLikes, ...recentInterested, ...recentComments]
    .map((item: any) => new Date(item.createdAt).getTime())
    .filter(Number.isFinite)
    .sort((left, right) => right - left)[0];
  const protectedUntil = latestSignalAt
    ? new Date(latestSignalAt + config.hotProtectionHours * 60 * 60 * 1000)
    : null;

  const isHot = score >= config.hotScoreThreshold;
  return {
    hotScore: score,
    isHot,
    hotUntil: isHot && protectedUntil && protectedUntil.getTime() > now ? protectedUntil.toISOString() : undefined
  };
}

function compareHomepageFeaturedIdeas(left: CommunityIdea, right: CommunityIdea) {
  const featuredGap = Number(right.homepageFeatured) - Number(left.homepageFeatured);
  if (featuredGap) return featuredGap;
  if (left.homepageFeatured && right.homepageFeatured) {
    const leftOrder = left.homepageFeaturedOrder ?? 99;
    const rightOrder = right.homepageFeaturedOrder ?? 99;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  }
  return 0;
}

function userPublic(user: UserRow) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    avatar: publicCommunityAvatar(user.avatar, user.id) || undefined,
    bio: user.bio || undefined,
    profileCompleted: Boolean(user.profileCompleted),
    country: user.country || undefined,
    countryCode: user.countryCode || undefined,
    industry: user.industry || undefined,
    occupation: user.occupation || undefined,
    expertRole: user.expertRole || undefined,
    expertVerified: Boolean(user.expertVerified)
  };
}

function ideaToCommunityIdea(
  row: any,
  options: {
    includeAdminFields?: boolean;
    ranking?: CommunityRankingConfig;
    reportCount?: number;
    reportReasons?: string[];
  } = {}
): CommunityIdea {
  const reactions = Array.isArray(row.reactions) ? row.reactions : [];
  const comments = Array.isArray(row.comments) ? row.comments : [];
  const shares = Array.isArray(row.shares) ? row.shares : [];
  const hot = hotSignals(row, options.ranking);
  const review = row.review && (
    options.includeAdminFields || row.review.assessmentStatus === "Published"
  ) ? row.review : null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    postType: normalizeCommunityPostType(row.postType),
    productStage: normalizeCommunityProductStage(row.productStage),
    country: row.country,
    imageUrls: ideaImageUrls(row.imageUrlsJson, row.slug, !isApprovedPublicIdea(row)),
    questions: normalizeQuestions(parseJson(row.questionsJson, [])),
    otherQuestion: row.otherQuestion || undefined,
    visibility: normalizeVisibility(row.visibility),
    moderationStatus: normalizeIdeaModerationStatus(row.moderationStatus),
    status: normalizeStatus(row.status),
    hidden: Boolean(row.hidden),
    locked: Boolean(row.locked),
    pinned: Boolean(row.pinned),
    homepageFeatured: Boolean(row.homepageFeatured),
    homepageFeaturedOrder: typeof row.homepageFeaturedOrder === "number" ? row.homepageFeaturedOrder : undefined,
    publicConsentAt: options.includeAdminFields && row.publicConsentAt ? iso(row.publicConsentAt) : undefined,
    moderatedAt: options.includeAdminFields && row.moderatedAt ? iso(row.moderatedAt) : undefined,
    moderationNote: options.includeAdminFields ? row.moderationNote || undefined : undefined,
    author: userPublic(row.author),
    comments: comments
      .filter((comment: any) => !comment.hidden)
      .map((comment: any) => ({
        id: comment.id,
        body: comment.body,
        hidden: Boolean(comment.hidden),
        parentId: comment.parentId || undefined,
        author: userPublic(comment.author),
        likeCount: (comment.reactions || []).filter((reaction: any) => ["Helpful", "Like"].includes(reaction.type)).length,
        viewerLiked: false,
        helpfulCount: (comment.reactions || []).filter((reaction: any) => ["Helpful", "Like"].includes(reaction.type)).length,
        viewerHelpful: false,
        createdAt: iso(comment.createdAt)
      })),
    review: review
      ? {
          id: review.id,
          manufacturingFeasible: review.manufacturingFeasible || undefined,
          estimatedCostRange: review.estimatedCostRange || undefined,
          suggestedMaterial: review.suggestedMaterial || undefined,
          estimatedMoq: review.estimatedMoq || undefined,
          suggestedManufacturing: review.suggestedManufacturing || undefined,
          factoriesMatched: review.factoriesMatched || undefined,
          additionalNotes: review.additionalNotes || undefined,
          moldRequirement: review.moldRequirement || undefined,
          assumptions: review.assumptions || undefined,
          confidence: review.confidence || undefined,
          assessmentStatus: review.assessmentStatus === "Published" ? "Published" : "Draft",
          disclaimer: review.disclaimer,
          mainRisks: review.mainRisks || undefined,
          recommendedNextStep: review.recommendedNextStep || undefined,
          customEligible: Boolean(review.customEligible),
          publishedAt: review.publishedAt ? iso(review.publishedAt) : undefined,
          createdAt: iso(review.createdAt),
          updatedAt: iso(review.updatedAt)
        }
      : undefined,
    likeCount: reactions.filter((reaction: any) => ["Helpful", "Like"].includes(reaction.type)).length,
    helpfulCount: reactions.filter((reaction: any) => ["Helpful", "Like"].includes(reaction.type)).length,
    interestedCount: reactions.filter((reaction: any) => reaction.type === "Interested").length,
    shareCount: shares.length,
    reportCount: options.includeAdminFields ? options.reportCount || 0 : undefined,
    reportReasons: options.includeAdminFields ? options.reportReasons || [] : undefined,
    hotScore: hot.hotScore,
    isHot: hot.isHot,
    hotUntil: hot.hotUntil,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt)
  };
}

const ideaInclude = {
  author: true,
  comments: {
    orderBy: { createdAt: "asc" },
    include: {
      author: true,
      reactions: true
    }
  },
  review: true,
  reactions: true,
  shares: true
} as const;

export type CommunityActivityItem = {
  id: string;
  type: "idea" | "comment" | "review" | "status";
  label: string;
  href: string;
  createdAt: string;
};

export async function upsertCommunityUser(input: {
  googleId?: string | null;
  email: string;
  name: string;
  avatar?: string | null;
  country?: string | null;
}): Promise<CommunityUser> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.communityUser.findUnique({ where: { email } });
  const id = existing?.id || makeCommunityId("USER");
  let username = existing?.username || usernameFromEmail(email);
  if (!existing) {
    const collision = await prisma.communityUser.findUnique({ where: { username } });
    if (collision) username = `${username}-${Date.now().toString(36)}`;
  }

  const row = await prisma.communityUser.upsert({
    where: { email },
    create: {
      id,
      googleId: input.googleId || null,
      email,
      username,
      name: input.name || username,
      avatar: input.avatar || null,
      profileCompleted: false,
      country: input.country || null
    },
    update: {
      googleId: input.googleId || existing?.googleId || null,
      name: input.name || username,
      avatar: input.avatar || null,
      country: input.country || null
    }
  });

  return {
    id: row.id,
    googleId: row.googleId || undefined,
    email: row.email,
    username: row.username,
    name: row.name,
    avatar: row.avatar || undefined,
    bio: row.bio || undefined,
    profileCompleted: row.profileCompleted,
    country: row.country || undefined,
    countryCode: row.countryCode || undefined,
    industry: row.industry || undefined,
    occupation: row.occupation || undefined,
    expertRole: row.expertRole || undefined,
    expertVerified: Boolean(row.expertVerified),
    joinedAt: iso(row.joinedAt)
  };
}

export async function getCommunityUser(userId: string) {
  const row = await prisma.communityUser.findUnique({ where: { id: userId } });
  return row
    ? {
        id: row.id,
        googleId: row.googleId || undefined,
        email: row.email,
        username: row.username,
        name: row.name,
        avatar: row.avatar || undefined,
        bio: row.bio || undefined,
        profileCompleted: row.profileCompleted,
        country: row.country || undefined,
        countryCode: row.countryCode || undefined,
        industry: row.industry || undefined,
        occupation: row.occupation || undefined,
        expertRole: row.expertRole || undefined,
        expertVerified: Boolean(row.expertVerified),
        joinedAt: iso(row.joinedAt)
      }
    : null;
}

function safeProfileString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function safeAvatarUrl(value: unknown) {
  const avatar = safeProfileString(value, MAX_INLINE_AVATAR_LENGTH);
  if (!avatar) return null;
  return safePublicImageUrl(avatar, MAX_INLINE_AVATAR_LENGTH);
}

export async function updateCommunityProfile(userId: string, input: unknown) {
  const data = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const name = safeProfileString(data.name, 80);
  const bio = safeProfileString(data.bio, 180);
  const industry = safeProfileString(data.industry, 40);
  const occupation = safeProfileString(data.occupation, 80);
  const countryOption = profileCountryFromCode(safeProfileString(data.countryCode, 2));
  const avatar = safeAvatarUrl(data.avatar);
  if (!name) throw new Error("Display name is required.");
  if (!isProfileIndustry(industry)) throw new Error("Industry is required.");
  if (!countryOption) throw new Error("Country is required.");

  const existing = await prisma.communityUser.findUnique({ where: { id: userId } });
  if (!existing) throw new Error("User not found.");

  const row = await prisma.communityUser.update({
    where: { id: userId },
    data: {
      name,
      avatar,
      bio: bio || null,
      industry,
      occupation: occupation || null,
      country: countryOption.name,
      countryCode: countryOption.iso,
      profileCompleted: true
    }
  });

  return {
    id: row.id,
    googleId: row.googleId || undefined,
    email: row.email,
    username: row.username,
    name: row.name,
    avatar: row.avatar || undefined,
    bio: row.bio || undefined,
    profileCompleted: row.profileCompleted,
    country: row.country || undefined,
    countryCode: row.countryCode || undefined,
    industry: row.industry || undefined,
    occupation: row.occupation || undefined,
    expertRole: row.expertRole || undefined,
    expertVerified: Boolean(row.expertVerified),
    joinedAt: iso(row.joinedAt)
  };
}

const approvedPublicIdeaWhere: Prisma.CommunityIdeaWhereInput = {
  hidden: false,
  visibility: "Public",
  moderationStatus: "Approved",
  status: { notIn: ["Pending", "Rejected", "Draft"] }
};

export async function getCommunityIdeas(
  sort: CommunityFeedSort = "newest",
  context: IdeaAccessContext = {},
  limit = 50
) {
  const requestedLimit = Number.isFinite(limit) ? Math.round(limit) : 50;
  const safeLimit = Math.min(50, Math.max(1, requestedLimit));
  const orderBy =
    sort === "recently-active" || sort === "latest-comments"
      ? { updatedAt: "desc" as const }
      : sort === "latest-tyora-reply"
        ? { review: { updatedAt: "desc" as const } }
        : sort === "trending"
          ? [{ pinned: "desc" as const }, { updatedAt: "desc" as const }]
          : { createdAt: "desc" as const };

  const [content, rows] = await Promise.all([
    getContent(),
    prisma.communityIdea.findMany({
      where: context.isAdmin
        ? {}
        : context.userId
          ? { OR: [approvedPublicIdeaWhere, { authorId: context.userId }] }
          : approvedPublicIdeaWhere,
      orderBy,
      take: sort === "trending" ? 50 : safeLimit,
      include: ideaInclude
    })
  ]);
  const ranking = content.communityPage;
  const reportReceipts = context.isAdmin && rows.length
    ? await prisma.communityActionReceipt.findMany({
        where: {
          action: "report",
          resourceId: { in: rows.map((row) => row.id) },
          expiresAt: { gt: new Date() }
        },
        select: { resourceId: true, resultJson: true }
      })
    : [];
  const reportSummaries = new Map<string, { count: number; reasons: string[] }>();
  for (const receipt of reportReceipts) {
    const current = reportSummaries.get(receipt.resourceId) || { count: 0, reasons: [] };
    const result = parseJson<{ reason?: string }>(receipt.resultJson, {});
    current.count += 1;
    if (result.reason) current.reasons.push(result.reason);
    reportSummaries.set(receipt.resourceId, current);
  }
  const ideas = rows.map((row) => {
    const reports = reportSummaries.get(row.id);
    return ideaToCommunityIdea(row, {
      includeAdminFields: Boolean(context.isAdmin),
      ranking,
      reportCount: reports?.count,
      reportReasons: reports?.reasons
    });
  });
  if (sort !== "trending") return ideas;

  return ideas.sort((left, right) => {
    const homepageFeatured = compareHomepageFeaturedIdeas(left, right);
    if (homepageFeatured) return homepageFeatured;
    const pinned = Number(right.pinned) - Number(left.pinned);
    if (pinned) return pinned;
    const hotProtected = Number(Boolean(right.hotUntil)) - Number(Boolean(left.hotUntil));
    if (hotProtected) return hotProtected;
    const hotScore = right.hotScore - left.hotScore;
    if (hotScore) return hotScore;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  }).slice(0, safeLimit);
}

export async function getPublicCreatorProfile(publicId: string) {
  const userId = String(publicId || "").trim();
  if (!userId) return null;
  const [user, rows] = await Promise.all([
    prisma.communityUser.findUnique({ where: { id: userId } }),
    prisma.communityIdea.findMany({
      where: { ...approvedPublicIdeaWhere, authorId: userId },
      orderBy: { createdAt: "desc" },
      include: ideaInclude
    })
  ]);
  if (!user || !user.profileCompleted) return null;
  const ideas = rows.map((row) => ideaToCommunityIdea(row));
  return {
    user: {
      ...userPublic(user),
      joinedAt: iso(user.joinedAt)
    },
    ideas,
    stats: {
      posts: ideas.length,
      comments: ideas.reduce((total, idea) => total + idea.comments.length, 0),
      helpful: ideas.reduce((total, idea) => total + idea.helpfulCount, 0),
      interested: ideas.reduce((total, idea) => total + idea.interestedCount, 0),
      reviews: ideas.filter((idea) => idea.review?.assessmentStatus === "Published").length
    }
  };
}

export async function getCommunityStats() {
  const ideas = await prisma.communityIdea.findMany({
    where: approvedPublicIdeaWhere,
    select: {
      status: true,
      country: true,
      review: { select: { id: true, assessmentStatus: true } }
    }
  });
  return {
    ideas: ideas.length,
    reviews: ideas.filter((idea) => idea.review?.assessmentStatus === "Published").length,
    projects: ideas.filter((idea) => ["Project Started", "Manufacturing", "Shipping", "Completed"].includes(idea.status)).length,
    inProgress: ideas.filter((idea) => ["Project Started", "Manufacturing", "Shipping"].includes(idea.status)).length,
    delivered: ideas.filter((idea) => idea.status === "Completed").length,
    countries: new Set(ideas.map((idea) => idea.country).filter(Boolean)).size
  };
}

export async function getCommunityActivity(limit = 8): Promise<CommunityActivityItem[]> {
  const safeLimit = Math.min(20, Math.max(1, Number.isFinite(limit) ? Math.round(limit) : 8));
  const [ideas, comments, reviews, statusIdeas] = await Promise.all([
    prisma.communityIdea.findMany({
      where: approvedPublicIdeaWhere,
      orderBy: { createdAt: "desc" },
      take: safeLimit,
      include: { author: true }
    }),
    prisma.communityComment.findMany({
      where: { hidden: false, idea: approvedPublicIdeaWhere },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
      include: { author: true, idea: true }
    }),
    prisma.tyoraReview.findMany({
      where: { assessmentStatus: "Published", idea: approvedPublicIdeaWhere },
      orderBy: { updatedAt: "desc" },
      take: safeLimit,
      include: { idea: true }
    }),
    prisma.communityIdea.findMany({
      where: {
        ...approvedPublicIdeaWhere,
        status: { in: ["Project Started", "Manufacturing", "Shipping", "Completed"] }
      },
      orderBy: { updatedAt: "desc" },
      take: safeLimit
    })
  ]);

  return [
    ...ideas.map((idea) => ({
      id: `idea-${idea.id}`,
      type: "idea" as const,
      label: `${idea.author.name} uploaded ${idea.title}`,
      href: `/ask/${idea.slug}`,
      createdAt: iso(idea.createdAt)
    })),
    ...comments.map((comment) => ({
      id: `comment-${comment.id}`,
      type: "comment" as const,
      label: `${comment.author.name} commented on ${comment.idea.title}`,
      href: `/ask/${comment.idea.slug}#community-discussion`,
      createdAt: iso(comment.createdAt)
    })),
    ...reviews.map((review) => ({
      id: `review-${review.id}`,
      type: "review" as const,
      label: `TYORA replied to ${review.idea.title}`,
      href: `/ask/${review.idea.slug}#tyora-expert-review`,
      createdAt: iso(review.updatedAt)
    })),
    ...statusIdeas.map((idea) => ({
      id: `status-${idea.id}-${idea.status}`,
      type: "status" as const,
      label: `${idea.title} moved to ${idea.status}`,
      href: `/ask/${idea.slug}`,
      createdAt: iso(idea.updatedAt)
    }))
  ]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, safeLimit);
}

export async function getCommunityIdeaBySlug(slug: string, context: IdeaAccessContext = {}) {
  const content = await getContent();
  const row = await prisma.communityIdea.findUnique({
    where: { slug },
    include: ideaInclude
  });
  if (!row || !isApprovedPublicIdea(row) && !context.isAdmin && row.authorId !== context.userId) return null;
  return ideaToCommunityIdea(row, {
    includeAdminFields: Boolean(context.isAdmin),
    ranking: content.communityPage
  });
}

type CommunityIdeaImageResult =
  | { access: "public" | "private"; contentType: string; body: Buffer }
  | { access: "public"; redirectUrl: string }
  | { access: "public" | "private"; objectPath: string };

export async function getCommunityIdeaImage(
  slug: string,
  index: number,
  context: IdeaAccessContext = {}
): Promise<CommunityIdeaImageResult | null> {
  if (!Number.isInteger(index) || index < 0 || index > 8) return null;
  const row = await prisma.communityIdea.findUnique({
    where: { slug },
    select: {
      imageUrlsJson: true,
      hidden: true,
      visibility: true,
      moderationStatus: true,
      status: true,
      authorId: true
    }
  });
  if (!row || !isApprovedPublicIdea(row) && !context.isAdmin && row.authorId !== context.userId) return null;
  const imageUrls = parseJson<unknown[]>(row.imageUrlsJson, []);
  if (!Array.isArray(imageUrls)) return null;
  const image = imageUrls[index];
  const dataImage = parseStoredDataImage(image);
  const access = isApprovedPublicIdea(row) ? "public" as const : "private" as const;
  if (dataImage) return { ...dataImage, access };
  if (typeof image === "string" && image.startsWith("private:idea-submissions/")) {
    return { access, objectPath: image.slice("private:".length) };
  }
  if (access === "private") return null;
  const publicUrl = safePublicImageUrl(image);
  return publicUrl ? { access, redirectUrl: publicUrl } : null;
}

export async function getCommunityUserAvatar(userId: string) {
  const row = await prisma.communityUser.findUnique({
    where: { id: userId },
    select: { avatar: true }
  });
  if (!row?.avatar) return null;
  const dataImage = parseStoredDataImage(row.avatar);
  if (dataImage) return dataImage;
  const publicUrl = safePublicImageUrl(row.avatar, MAX_INLINE_AVATAR_LENGTH);
  return publicUrl ? { redirectUrl: publicUrl } : null;
}

export async function getCommunityUserActivity(userId: string) {
  const user = await prisma.communityUser.findUnique({ where: { id: userId } });
  if (!user) return null;
  const lastSeenAt = user.lastNotificationSeenAt;

  const [ideas, comments, reactions, receivedComments, receivedReactions, reviewedIdeas, moderatedIdeas] = await Promise.all([
    prisma.communityIdea.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: "desc" },
      include: ideaInclude
    }),
    prisma.communityComment.findMany({
      where: {
        authorId: userId,
        hidden: false,
        idea: { OR: [approvedPublicIdeaWhere, { authorId: userId }] }
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        idea: {
          include: ideaInclude
        }
      }
    }),
    prisma.communityReaction.findMany({
      where: {
        userId,
        ideaId: { not: null },
        idea: { OR: [approvedPublicIdeaWhere, { authorId: userId }] }
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        idea: {
          include: ideaInclude
        }
      }
    }),
    prisma.communityComment.findMany({
      where: { hidden: false, authorId: { not: userId }, idea: { authorId: userId } },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        author: true,
        idea: true
      }
    }),
    prisma.communityReaction.findMany({
      where: { userId: { not: userId }, ideaId: { not: null }, idea: { authorId: userId } },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        user: true,
        idea: true
      }
    }),
    prisma.communityIdea.findMany({
      where: { authorId: userId, review: { is: { assessmentStatus: "Published" } } },
      orderBy: { updatedAt: "desc" },
      take: 25,
      include: {
        review: true,
        author: true,
        comments: { include: { author: true, reactions: true } },
        reactions: true
      }
    }),
    prisma.communityIdea.findMany({
      where: {
        authorId: userId,
        moderationStatus: { in: ["Returned", "Removed"] },
        moderatedAt: { not: null }
      },
      orderBy: { moderatedAt: "desc" },
      take: 25
    })
  ]);

  const receivedLikes = receivedReactions.filter((reaction) => ["Helpful", "Like"].includes(reaction.type)).length;
  const receivedInterested = receivedReactions.filter((reaction) => reaction.type === "Interested").length;
  const isUnread = (value: Date | string | null | undefined) => {
    if (!lastSeenAt || !value) return true;
    return new Date(value).getTime() > lastSeenAt.getTime();
  };
  const unreadReceivedComments = receivedComments.filter((comment) => isUnread(comment.createdAt)).length;
  const unreadReceivedReactions = receivedReactions.filter((reaction) => isUnread(reaction.createdAt)).length;
  const unreadReviewedIdeas = reviewedIdeas.filter((idea) => isUnread(idea.review?.updatedAt || idea.updatedAt)).length;
  const unreadModeratedIdeas = moderatedIdeas.filter((idea) => isUnread(idea.moderatedAt)).length;
  const unreadStatusIdeas = ideas.filter((idea) => idea.status !== "Discussing" && isUnread(idea.updatedAt)).length + unreadModeratedIdeas;
  const notifications = [
    ...receivedComments.map((comment) => ({
      id: `comment-${comment.id}`,
      type: "comment" as const,
      title: `${comment.author.name} commented on your idea`,
      body: comment.body,
      href: `/ask/${comment.idea.slug}`,
      ideaSlug: comment.idea.slug,
      parentId: comment.id,
      createdAt: iso(comment.createdAt)
    })),
    ...receivedReactions.map((reaction) => ({
      id: `reaction-${reaction.id}`,
      type: reaction.type === "Interested" ? "interested" as const : "like" as const,
      title: `${reaction.user.name} ${reaction.type === "Interested" ? "is interested in" : "found your idea helpful"}`,
      body: reaction.idea?.title || "Your idea",
      href: reaction.idea ? `/ask/${reaction.idea.slug}` : "/ask",
      ideaSlug: reaction.idea?.slug,
      createdAt: iso(reaction.createdAt)
    })),
    ...reviewedIdeas.map((idea) => ({
      id: `review-${idea.id}`,
      type: "review" as const,
      title: "TYORA reviewed your idea",
      body: idea.title,
      href: `/ask/${idea.slug}`,
      ideaSlug: idea.slug,
      createdAt: iso(idea.review?.updatedAt || idea.updatedAt)
    })),
    ...moderatedIdeas.map((idea) => ({
      id: `moderation-${idea.id}-${idea.moderationStatus}`,
      type: "status" as const,
      title: idea.moderationStatus === "Returned"
        ? "TYORA returned your idea for changes"
        : "TYORA removed your idea",
      body: idea.moderationNote || idea.title,
      href: idea.moderationStatus === "Returned" ? `/me?revise=${encodeURIComponent(idea.slug)}` : `/ask/${idea.slug}`,
      ideaSlug: idea.slug,
      createdAt: iso(idea.moderatedAt)
    })),
    ...ideas
      .filter((idea) => idea.status !== "Discussing")
      .map((idea) => ({
        id: `status-${idea.id}`,
        type: "status" as const,
        title: `Your idea status is ${idea.status}`,
        body: idea.title,
        href: `/ask/${idea.slug}`,
        ideaSlug: idea.slug,
        createdAt: iso(idea.updatedAt)
      }))
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, 40);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: safePublicImageUrl(user.avatar, MAX_INLINE_AVATAR_LENGTH) || undefined,
      bio: user.bio || undefined,
      profileCompleted: user.profileCompleted,
      country: user.country || undefined,
      countryCode: user.countryCode || undefined,
      industry: user.industry || undefined,
      occupation: user.occupation || undefined,
      expertRole: user.expertRole || undefined,
      expertVerified: Boolean(user.expertVerified),
      joinedAt: iso(user.joinedAt)
    },
    stats: {
      ideasPosted: ideas.length,
      commentsMade: comments.length,
      likedIdeas: reactions.filter((reaction) => ["Helpful", "Like"].includes(reaction.type)).length,
      interestedIdeas: reactions.filter((reaction) => reaction.type === "Interested").length,
      receivedComments: receivedComments.length,
      receivedLikes,
      receivedInterested,
      notifications: notifications.length,
      unreadReceivedComments,
      unreadReceivedReactions,
      unreadReviewedIdeas,
      unreadStatusIdeas
    },
    ideas: ideas.map((idea) => ideaToCommunityIdea(idea)),
    comments: comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: iso(comment.createdAt),
      idea: ideaToCommunityIdea(comment.idea)
    })),
    likedIdeas: reactions
      .filter((reaction) => ["Helpful", "Like"].includes(reaction.type) && reaction.idea)
      .map((reaction) => ({ id: reaction.id, createdAt: iso(reaction.createdAt), idea: ideaToCommunityIdea(reaction.idea) })),
    interestedIdeas: reactions
      .filter((reaction) => reaction.type === "Interested" && reaction.idea)
      .map((reaction) => ({ id: reaction.id, createdAt: iso(reaction.createdAt), idea: ideaToCommunityIdea(reaction.idea) })),
    notifications
  };
}

export async function getCommunityNotificationCount(userId: string) {
  const user = await prisma.communityUser.findUnique({
    where: { id: userId },
    select: { lastNotificationSeenAt: true }
  });
  if (!user) return 0;
  const after = user.lastNotificationSeenAt ? { gt: user.lastNotificationSeenAt } : undefined;
  const [receivedComments, receivedReactions, reviewedIdeas, statusIdeas, moderatedIdeas] = await Promise.all([
    prisma.communityComment.count({
      where: { hidden: false, authorId: { not: userId }, idea: { authorId: userId, hidden: false }, ...(after ? { createdAt: after } : {}) }
    }),
    prisma.communityReaction.count({
      where: { userId: { not: userId }, ideaId: { not: null }, idea: { authorId: userId, hidden: false }, ...(after ? { createdAt: after } : {}) }
    }),
    prisma.communityIdea.count({
      where: {
        authorId: userId,
        hidden: false,
        review: {
          is: {
            assessmentStatus: "Published",
            ...(after ? { updatedAt: after } : {})
          }
        }
      }
    }),
    prisma.communityIdea.count({
      where: { authorId: userId, hidden: false, status: { not: "Discussing" }, ...(after ? { updatedAt: after } : {}) }
    }),
    prisma.communityIdea.count({
      where: {
        authorId: userId,
        moderationStatus: { in: ["Returned", "Removed"] },
        moderatedAt: after || { not: null }
      }
    })
  ]);

  return receivedComments + receivedReactions + reviewedIdeas + statusIdeas + moderatedIdeas;
}

export async function markCommunityNotificationsRead(userId: string) {
  await prisma.communityUser.update({
    where: { id: userId },
    data: { lastNotificationSeenAt: new Date() }
  });
}

export async function countReviewsUsedToday(userId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.communityIdea.count({
    where: {
      authorId: userId,
      createdAt: { gte: start }
    }
  });
}

export async function createCommunityIdea(input: unknown, authorId: string) {
  const data = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const title = typeof data.title === "string" ? data.title.trim().slice(0, 140) : "";
  const description = typeof data.description === "string" ? data.description.trim().slice(0, 5000) : "";
  const category = typeof data.category === "string" ? data.category.trim().slice(0, 120) : "";
  const postType = normalizeCommunityPostType(data.postType);
  const productStage = normalizeCommunityProductStage(data.productStage);
  const country = typeof data.country === "string" ? data.country.trim().slice(0, 120) : "";
  if (!title || !description || !category || !country) {
    throw new Error("Title, description, category, and country are required.");
  }

  const author = await prisma.communityUser.findUnique({
    where: { id: authorId },
    select: { profileCompleted: true }
  });
  if (!author?.profileCompleted) {
    throw new Error("Complete your TYORA profile before publishing.");
  }
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recentPostCount, duplicate] = await Promise.all([
    prisma.communityIdea.count({ where: { authorId, createdAt: { gte: oneHourAgo } } }),
    prisma.communityIdea.findFirst({
      where: { authorId, title, description, createdAt: { gte: oneDayAgo } },
      select: { id: true }
    })
  ]);
  if (recentPostCount >= 6) throw new Error("You can publish up to 6 ideas per hour. Please try again later.");
  if (duplicate) throw new Error("This idea was already published recently.");
  const externalLinks = description.match(/https?:\/\/[^\s]+/gi) || [];
  if (externalLinks.length > 3) throw new Error("Please limit your post to 3 external links.");

  const visibility = normalizeVisibility(data.visibility);
  const publicConsent = data.publicContentConsent === true &&
    data.publicImageConsent === true &&
    data.publicAssessmentConsent === true;
  if (visibility === "Public" && !publicConsent) {
    throw new Error("Public ideas require consent for the post, uploaded images, and TYORA assessment to be displayed publicly.");
  }
  const submittedImageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls.map((item) => safePublicImageUrl(item)).filter((item): item is string => Boolean(item)).slice(0, 9)
    : [];
  const imageUrls = submittedImageUrls.length
    ? await storePrivateIdeaImages(submittedImageUrls)
    : [];

  const id = makeCommunityId("IDEA");
  const row = await prisma.communityIdea.create({
    data: {
      id,
      slug: slugifyCommunityIdea(title, id),
      title,
      description,
      category,
      postType,
      productStage,
      country,
      imageUrlsJson: JSON.stringify(imageUrls),
      questionsJson: JSON.stringify(normalizeQuestions(data.questions)),
      otherQuestion: typeof data.otherQuestion === "string" ? data.otherQuestion.trim().slice(0, 500) || null : null,
      visibility,
      moderationStatus: "Approved",
      status: "Discussing",
      publicConsentAt: visibility === "Public" ? new Date() : null,
      authorId
    },
    include: ideaInclude
  });
  return ideaToCommunityIdea(row);
}

export async function addCommunityComment(
  slug: string,
  input: unknown,
  authorId: string,
  request: Request,
  context: IdeaAccessContext = { userId: authorId }
) {
  const idea = await prisma.communityIdea.findUnique({ where: { slug } });
  assertCanInteractWithIdea(idea, context);
  if (idea.locked) throw new Error("Comments are locked for this idea.");
  const data = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const body = typeof data.body === "string" ? data.body.trim().slice(0, 1600) : "";
  if (!body) throw new Error("Comment is required.");
  const parentId = typeof data.parentId === "string" ? data.parentId : null;
  if (parentId) {
    const parent = await prisma.communityComment.findFirst({
      where: { id: parentId, ideaId: idea.id, hidden: false },
      select: { id: true }
    });
    if (!parent) throw new Error("Comment not found.");
  }

  await executeGuardedCommunityAction({
    request,
    userId: authorId,
    action: "comment",
    resourceId: idea.id,
    execute: async (tx) => {
      const id = makeCommunityId("COMMENT");
      await tx.communityComment.create({
        data: { id, body, parentId, ideaId: idea.id, authorId }
      });
      await tx.communityIdea.update({
        where: { id: idea.id },
        data: { updatedAt: new Date() }
      });
      return { id };
    }
  });
  return getCommunityIdeaBySlug(slug, context);
}

export async function toggleCommunityReaction(
  slug: string,
  type: "Helpful" | "Like" | "Interested",
  userId: string,
  request: Request,
  context: IdeaAccessContext = { userId }
) {
  const idea = await prisma.communityIdea.findUnique({ where: { slug } });
  assertCanInteractWithIdea(idea, context);
  await executeGuardedCommunityAction({
    request,
    userId,
    action: "reaction",
    resourceId: `${idea.id}:${type}`,
    execute: async (tx) => {
      const compatibleTypes = type === "Helpful" ? ["Helpful", "Like"] : [type];
      const existing = await tx.communityReaction.findFirst({
        where: { ideaId: idea.id, userId, type: { in: compatibleTypes } }
      });
      if (existing) {
        await tx.communityReaction.deleteMany({
          where: { ideaId: idea.id, userId, type: { in: compatibleTypes } }
        });
      } else {
        await tx.communityReaction.create({
          data: { id: makeCommunityId("REACTION"), ideaId: idea.id, userId, type: type === "Like" ? "Helpful" : type }
        });
      }
      await tx.communityIdea.update({
        where: { id: idea.id },
        data: { updatedAt: new Date() }
      });
      return { active: !existing };
    }
  });
  return getCommunityIdeaBySlug(slug, context);
}

export async function toggleCommunityCommentReaction(
  slug: string,
  commentId: string,
  userId: string,
  request: Request,
  context: IdeaAccessContext = { userId }
) {
  const idea = await prisma.communityIdea.findUnique({ where: { slug } });
  assertCanInteractWithIdea(idea, context);
  const comment = await prisma.communityComment.findFirst({
    where: {
      id: commentId,
      ideaId: idea.id,
      hidden: false
    },
    select: { id: true }
  });
  if (!comment) throw new Error("Comment not found.");

  await executeGuardedCommunityAction({
    request,
    userId,
    action: "comment-reaction",
    resourceId: comment.id,
    execute: async (tx) => {
      const existing = await tx.communityReaction.findFirst({
        where: { commentId: comment.id, userId, type: { in: ["Helpful", "Like"] } }
      });
      if (existing) {
        await tx.communityReaction.deleteMany({
          where: { commentId: comment.id, userId, type: { in: ["Helpful", "Like"] } }
        });
      } else {
        await tx.communityReaction.create({
          data: { id: makeCommunityId("REACTION"), commentId: comment.id, userId, type: "Helpful" }
        });
      }
      await tx.communityIdea.update({
        where: { id: idea.id },
        data: { updatedAt: new Date() }
      });
      return { active: !existing };
    }
  });
  return getCommunityIdeaBySlug(slug, context);
}

const shareChannels = new Set(["native", "copy", "facebook", "linkedin", "x", "whatsapp", "email"]);

export async function recordCommunityShare(
  slug: string,
  channelInput: unknown,
  userId: string,
  request: Request,
  context: IdeaAccessContext = { userId }
) {
  const idea = await prisma.communityIdea.findUnique({ where: { slug } });
  assertCanInteractWithIdea(idea, context);
  const channel = typeof channelInput === "string" ? channelInput.trim().toLowerCase() : "";
  if (!shareChannels.has(channel)) throw new Error("Invalid share channel.");

  await executeGuardedCommunityAction({
    request,
    userId,
    action: "share",
    resourceId: `${idea.id}:${channel}`,
    execute: async (tx) => {
      const existing = await tx.communityShare.findUnique({
        where: { userId_ideaId_channel: { userId, ideaId: idea.id, channel } }
      });
      if (!existing) {
        await tx.communityShare.create({
          data: { id: makeCommunityId("SHARE"), channel, userId, ideaId: idea.id }
        });
      }
      return { recorded: !existing };
    }
  });
  const shareCount = await prisma.communityShare.count({ where: { ideaId: idea.id } });
  return { shareCount };
}

export async function reportCommunityIdea(
  slug: string,
  reasonInput: unknown,
  userId: string,
  request: Request,
  context: IdeaAccessContext = { userId }
) {
  const idea = await prisma.communityIdea.findUnique({ where: { slug } });
  assertCanInteractWithIdea(idea, context);
  if (idea.authorId === userId) throw new Error("You cannot report your own discussion.");
  const reason = typeof reasonInput === "string" ? reasonInput.trim().replace(/\s+/g, " ") : "";
  if (reason.length < 10 || reason.length > 500) {
    throw new Error("Please explain the concern in 10–500 characters.");
  }

  const result = await executeGuardedCommunityAction({
    request,
    userId,
    action: "report",
    resourceId: idea.id,
    execute: async () => ({ recorded: true, reason })
  });
  return { recorded: true, replayed: result.replayed };
}

export async function getCommunityReactionState(
  slug: string,
  userId: string,
  context: IdeaAccessContext = { userId }
) {
  const idea = await prisma.communityIdea.findUnique({ where: { slug } });
  assertCanReadIdea(idea, context);
  const reactions = await prisma.communityReaction.findMany({
    where: { ideaId: idea.id, userId },
    select: { type: true }
  });
  return {
    helpful: reactions.some((reaction) => ["Helpful", "Like"].includes(reaction.type)),
    liked: reactions.some((reaction) => ["Helpful", "Like"].includes(reaction.type)),
    interested: reactions.some((reaction) => reaction.type === "Interested")
  };
}

export async function updateCommunityIdeaOwner(slug: string, input: unknown, userId: string) {
  const existing = await prisma.communityIdea.findUnique({ where: { slug } });
  assertCanReadIdea(existing, { userId });
  if (existing.authorId !== userId) throw new IdeaNotFoundError();
  if (existing.moderationStatus === "Removed") {
    throw new Error("Removed posts cannot be edited. Contact TYORA if you believe this was a mistake.");
  }

  const data = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const title = typeof data.title === "string" ? data.title.trim().slice(0, 140) : existing.title;
  const description = typeof data.description === "string" ? data.description.trim().slice(0, 5000) : existing.description;
  const category = typeof data.category === "string" ? data.category.trim().slice(0, 120) : existing.category;
  const country = typeof data.country === "string" ? data.country.trim().slice(0, 120) : existing.country;
  const postType = Object.prototype.hasOwnProperty.call(data, "postType")
    ? normalizeCommunityPostType(data.postType)
    : normalizeCommunityPostType(existing.postType);
  const productStage = Object.prototype.hasOwnProperty.call(data, "productStage")
    ? normalizeCommunityProductStage(data.productStage)
    : normalizeCommunityProductStage(existing.productStage);
  const imageUrls = Array.isArray(data.imageUrls)
    ? await ownerIdeaImageUrls(data.imageUrls, existing.imageUrlsJson, existing.slug)
    : storedIdeaImageUrls(existing.imageUrlsJson);
  const questions = Object.prototype.hasOwnProperty.call(data, "questions")
    ? normalizeQuestions(data.questions)
    : normalizeQuestions(parseJson(existing.questionsJson, []));
  const otherQuestion = questions.includes("Other")
    ? (Object.prototype.hasOwnProperty.call(data, "otherQuestion")
        ? (typeof data.otherQuestion === "string" ? data.otherQuestion.trim().slice(0, 500) : "")
        : existing.otherQuestion || "")
    : null;

  if (!title || !description || !category || !country) {
    throw new Error("Product name, category, description, and country are required.");
  }
  if (questions.includes("Other") && !otherQuestion) {
    throw new Error("Please enter the custom question you want TYORA to answer.");
  }

  await prisma.communityIdea.update({
    where: { slug },
    data: {
      title,
      description,
      category,
      country,
      postType,
      productStage,
      imageUrlsJson: JSON.stringify(imageUrls),
      questionsJson: JSON.stringify(questions),
      otherQuestion,
      moderationStatus: "Approved",
      hidden: false,
      locked: false,
      moderatedAt: null,
      moderationNote: null,
      homepageFeatured: false,
      homepageFeaturedOrder: null
    }
  });

  return getCommunityIdeaBySlug(slug, { userId });
}

export async function withdrawCommunityIdeaOwner(slug: string, userId: string) {
  const existing = await prisma.communityIdea.findUnique({ where: { slug } });
  assertCanReadIdea(existing, { userId });
  if (existing.authorId !== userId) throw new IdeaNotFoundError();

  await prisma.communityIdea.update({
    where: { slug },
    data: { hidden: true }
  });

  return { slug };
}

export async function deleteCommunityCommentOwner(slug: string, commentId: string, userId: string) {
  const comment = await prisma.communityComment.findUnique({
    where: { id: commentId },
    include: { idea: true }
  });
  if (!comment || comment.hidden || comment.idea.slug !== slug) throw new IdeaNotFoundError();
  assertCanReadIdea(comment.idea, { userId });
  if (comment.authorId !== userId) throw new IdeaNotFoundError();

  await prisma.communityComment.update({
    where: { id: comment.id },
    data: {
      hidden: true,
      body: "Comment deleted"
    }
  });
  await prisma.communityIdea.update({
    where: { id: comment.ideaId },
    data: { updatedAt: new Date() }
  });

  return { id: comment.id };
}

export async function updateCommunityIdeaAdmin(slug: string, input: unknown) {
  const content = await getContent();
  const existing = await prisma.communityIdea.findUnique({
    where: { slug },
    include: { review: true }
  });
  if (!existing) throw new Error("Idea not found.");
  const data = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const action = typeof data.action === "string" ? data.action.trim().toLowerCase() : "";
  if (["reply", "return", "remove"].includes(action)) {
    const reason = stringOrNull(data.reason);
    if ((action === "return" || action === "remove") && !reason) {
      throw new Error("A clear customer-facing reason is required.");
    }
    if (action === "reply") {
      const reply = stringOrNull(data.reply);
      if (!reply) throw new Error("Write a TYORA reply before publishing.");
      await prisma.$transaction([
        prisma.communityIdea.update({
          where: { slug },
          data: {
            moderationStatus: "Approved",
            hidden: false,
            moderationNote: null,
            moderatedAt: new Date()
          }
        }),
        prisma.tyoraReview.upsert({
          where: { ideaId: existing.id },
          create: {
            id: makeCommunityId("REVIEW"),
            ideaId: existing.id,
            additionalNotes: reply,
            assessmentStatus: "Published",
            disclaimer: content.communityPage.assessmentDisclaimer,
            publishedAt: new Date()
          },
          update: {
            additionalNotes: reply,
            assessmentStatus: "Published",
            disclaimer: existing.review?.disclaimer || content.communityPage.assessmentDisclaimer,
            publishedAt: existing.review?.publishedAt || new Date()
          }
        })
      ]);
      return getCommunityIdeaBySlug(slug, { isAdmin: true });
    }

    await prisma.communityIdea.update({
      where: { slug },
      data: {
        moderationStatus: action === "return" ? "Returned" : "Removed",
        moderationNote: reason,
        moderatedAt: new Date(),
        hidden: true,
        locked: action === "remove",
        pinned: false,
        homepageFeatured: false,
        homepageFeaturedOrder: null
      }
    });
    return getCommunityIdeaBySlug(slug, { isAdmin: true });
  }
  const review = data.review && typeof data.review === "object" && !Array.isArray(data.review)
    ? (data.review as Record<string, unknown>)
    : {};
  const hidden = typeof data.hidden === "boolean" ? data.hidden : existing.hidden;
  const moderationStatus = Object.prototype.hasOwnProperty.call(data, "moderationStatus")
    ? normalizeIdeaModerationStatus(data.moderationStatus)
    : normalizeIdeaModerationStatus(existing.moderationStatus);
  const moderationNote = Object.prototype.hasOwnProperty.call(data, "moderationNote")
    ? stringOrNull(data.moderationNote)
    : existing.moderationNote;
  const moderationChanged = moderationStatus !== existing.moderationStatus;
  const postType = Object.prototype.hasOwnProperty.call(data, "postType")
    ? normalizeCommunityPostType(data.postType)
    : normalizeCommunityPostType(existing.postType);
  const productStage = Object.prototype.hasOwnProperty.call(data, "productStage")
    ? normalizeCommunityProductStage(data.productStage)
    : normalizeCommunityProductStage(existing.productStage);
  const authorExpertRole = Object.prototype.hasOwnProperty.call(data, "authorExpertRole")
    ? stringOrNull(data.authorExpertRole)?.slice(0, 120) || null
    : undefined;
  const authorExpertVerified = typeof data.authorExpertVerified === "boolean"
    ? data.authorExpertVerified
    : undefined;
  const homepageFeaturedRequested = typeof data.homepageFeatured === "boolean" ? data.homepageFeatured : existing.homepageFeatured;
  const rawHomepageOrder = Number(data.homepageFeaturedOrder);
  const requestedHomepageOrder = Number.isInteger(rawHomepageOrder) && rawHomepageOrder >= 1 && rawHomepageOrder <= 3
    ? rawHomepageOrder
    : existing.homepageFeaturedOrder;
  let homepageFeatured = homepageFeaturedRequested && !hidden && moderationStatus === "Approved";
  let homepageFeaturedOrder = homepageFeatured ? requestedHomepageOrder : null;

  let structuredReview: {
    manufacturingFeasible: string | null | undefined;
    estimatedCostRange: string | null | undefined;
    suggestedMaterial: string | null | undefined;
    estimatedMoq: string | null | undefined;
    suggestedManufacturing: string | null | undefined;
    factoriesMatched: string | null | undefined;
    additionalNotes: string | null | undefined;
    moldRequirement: string | null | undefined;
    assumptions: string | null | undefined;
    confidence: string | null | undefined;
    assessmentStatus: "Draft" | "Published";
    disclaimer: string;
    mainRisks: string | null | undefined;
    recommendedNextStep: string | null | undefined;
    customEligible: boolean;
    publishedAt: Date | null;
  } | null = null;

  if (Object.keys(review).length > 0) {
    const reviewField = (key: keyof typeof review) => Object.prototype.hasOwnProperty.call(review, key)
      ? stringOrNull(review[key])
      : existing.review?.[key as keyof typeof existing.review] as string | null | undefined;
    const assessmentStatus = Object.prototype.hasOwnProperty.call(review, "assessmentStatus")
      ? review.assessmentStatus === "Published" ? "Published" : "Draft"
      : existing.review?.assessmentStatus === "Published" ? "Published" : "Draft";
    const disclaimer = reviewField("disclaimer") ||
      existing.review?.disclaimer ||
      content.communityPage.assessmentDisclaimer;
    const customEligible = typeof review.customEligible === "boolean"
      ? review.customEligible
      : Boolean(existing.review?.customEligible);
    structuredReview = {
      manufacturingFeasible: reviewField("manufacturingFeasible"),
      estimatedCostRange: reviewField("estimatedCostRange"),
      suggestedMaterial: reviewField("suggestedMaterial"),
      estimatedMoq: reviewField("estimatedMoq"),
      suggestedManufacturing: reviewField("suggestedManufacturing"),
      factoriesMatched: reviewField("factoriesMatched"),
      additionalNotes: reviewField("additionalNotes"),
      moldRequirement: reviewField("moldRequirement"),
      assumptions: reviewField("assumptions"),
      confidence: reviewField("confidence"),
      assessmentStatus,
      disclaimer,
      mainRisks: reviewField("mainRisks"),
      recommendedNextStep: reviewField("recommendedNextStep"),
      customEligible,
      publishedAt: assessmentStatus === "Published"
        ? existing.review?.publishedAt || new Date()
        : null
    };

    if (assessmentStatus === "Published" && moderationStatus !== "Approved") {
      throw new Error("Only approved ideas can publish a public assessment.");
    }
    if (assessmentStatus === "Published") {
      const required = [
        structuredReview.manufacturingFeasible,
        structuredReview.estimatedCostRange,
        structuredReview.estimatedMoq,
        structuredReview.assumptions,
        structuredReview.confidence,
        structuredReview.disclaimer
      ];
      if (required.some((value) => !value)) {
        throw new Error("Published assessments require feasibility, cost range, MOQ, assumptions, confidence, and disclaimer.");
      }
    }
  }

  if (homepageFeatured && (existing.visibility !== "Public" || moderationStatus !== "Approved")) {
    throw new Error("Only approved public ideas can be featured on the homepage.");
  }

  if (homepageFeatured && !homepageFeaturedOrder) {
    const selected = await prisma.communityIdea.findMany({
      where: {
        id: { not: existing.id },
        homepageFeatured: true,
        hidden: false,
        visibility: "Public",
        moderationStatus: "Approved"
      },
      select: { homepageFeaturedOrder: true }
    });
    const used = new Set(selected.map((idea) => idea.homepageFeaturedOrder).filter((value): value is number => typeof value === "number"));
    homepageFeaturedOrder = [1, 2, 3].find((slot) => !used.has(slot)) || null;
    if (!homepageFeaturedOrder) throw new Error("Homepage already has 3 featured ideas. Choose an existing slot to replace.");
  }

  await prisma.$transaction(async (tx) => {
    if (homepageFeatured && homepageFeaturedOrder) {
      await tx.communityIdea.updateMany({
        where: {
          id: { not: existing.id },
          homepageFeaturedOrder
        },
        data: {
          homepageFeatured: false,
          homepageFeaturedOrder: null
        }
      });
    }

    await tx.communityIdea.update({
      where: { slug },
      data: {
        status: normalizeStatus(data.status),
        postType,
        productStage,
        moderationStatus,
        moderatedAt: moderationChanged ? new Date() : existing.moderatedAt,
        moderationNote,
        hidden,
        locked: typeof data.locked === "boolean" ? data.locked : existing.locked,
        pinned: typeof data.pinned === "boolean" ? data.pinned : existing.pinned,
        homepageFeatured,
        homepageFeaturedOrder
      }
    });

    if (authorExpertRole !== undefined || authorExpertVerified !== undefined) {
      await tx.communityUser.update({
        where: { id: existing.authorId },
        data: {
          ...(authorExpertRole !== undefined ? { expertRole: authorExpertRole } : {}),
          ...(authorExpertVerified !== undefined ? { expertVerified: authorExpertVerified } : {})
        }
      });
    }

    if (structuredReview) {
      await tx.tyoraReview.upsert({
        where: { ideaId: existing.id },
        create: {
          id: makeCommunityId("REVIEW"),
          ideaId: existing.id,
          ...structuredReview
        },
        update: structuredReview
      });
    } else if (moderationStatus !== "Approved" && existing.review?.assessmentStatus === "Published") {
      await tx.tyoraReview.update({
        where: { ideaId: existing.id },
        data: { assessmentStatus: "Draft", publishedAt: null }
      });
    }
  });

  return getCommunityIdeaBySlug(slug, { isAdmin: true });
}

async function permanentlyDeleteCommunityIdea(existing: { id: string; slug: string; imageUrlsJson: string }) {
  const privatePaths = storedIdeaImageUrls(existing.imageUrlsJson)
    .filter((value) => value.startsWith("private:idea-submissions/"))
    .map((value) => value.slice("private:".length));
  for (const objectPath of privatePaths) await deletePrivateObject(objectPath);
  await prisma.$transaction(async (tx) => {
    const comments = await tx.communityComment.findMany({
      where: { ideaId: existing.id },
      select: { id: true }
    });
    const commentIds = comments.map((comment) => comment.id);

    await tx.communityReaction.deleteMany({
      where: {
        OR: [
          { ideaId: existing.id },
          ...(commentIds.length ? [{ commentId: { in: commentIds } }] : [])
        ]
      }
    });
    await tx.communityShare.deleteMany({ where: { ideaId: existing.id } });
    await tx.communityComment.deleteMany({ where: { ideaId: existing.id } });
    await tx.tyoraReview.deleteMany({ where: { ideaId: existing.id } });
    await tx.customInquiry.updateMany({ where: { ideaId: existing.id }, data: { ideaId: null } });
    await tx.communityActionReceipt.deleteMany({ where: { resourceId: existing.id } });
    await tx.communityIdea.delete({ where: { id: existing.id } });
  });

  return { slug: existing.slug, privateObjectsDeleted: privatePaths.length };
}

export async function deleteCommunityIdeaAdmin(slug: string) {
  const existing = await prisma.communityIdea.findUnique({
    where: { slug },
    select: { id: true, slug: true, imageUrlsJson: true }
  });
  if (!existing) throw new Error("Idea not found.");
  return permanentlyDeleteCommunityIdea(existing);
}

export async function cleanupRemovedCommunityIdeas(options: { now?: Date; retentionDays?: number; limit?: number } = {}) {
  const now = options.now || new Date();
  const retentionDays = Math.max(30, Math.floor(options.retentionDays || 30));
  const limit = Math.min(100, Math.max(1, Math.floor(options.limit || 50)));
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  const expired = await prisma.communityIdea.findMany({
    where: { moderationStatus: "Removed", hidden: true, moderatedAt: { lte: cutoff } },
    orderBy: { moderatedAt: "asc" },
    take: limit,
    select: { id: true, slug: true, imageUrlsJson: true }
  });
  const deleted = [];
  for (const idea of expired) deleted.push(await permanentlyDeleteCommunityIdea(idea));
  return { cutoff: cutoff.toISOString(), deletedCount: deleted.length, deleted };
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 3000) : null;
}

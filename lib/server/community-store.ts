import {
  CommunityFeedSort,
  CommunityIdea,
  CommunityUser,
  makeCommunityId,
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
import { uploadPrivateObject } from "@/lib/server/private-storage";

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
        .slice(0, 5)
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
    .slice(0, 5);
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
    /^\/api\/community\/(?:ideas|private-ideas)\/([^/]+)\/images\/([0-4])$/
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
  for (const item of input.slice(0, 5)) {
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
    return `/api/community/users/${encodeURIComponent(userId)}/avatar`;
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
  const recentLikes = reactions.filter((reaction: any) => reaction.type === "Like" && new Date(reaction.createdAt).getTime() >= since);
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
    country: user.country || undefined
  };
}

function ideaToCommunityIdea(
  row: any,
  options: {
    includeAdminFields?: boolean;
    ranking?: CommunityRankingConfig;
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
        likeCount: (comment.reactions || []).filter((reaction: any) => reaction.type === "Like").length,
        viewerLiked: false,
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
    likeCount: reactions.filter((reaction: any) => reaction.type === "Like").length,
    interestedCount: reactions.filter((reaction: any) => reaction.type === "Interested").length,
    shareCount: shares.length,
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
  const usernameInput = safeProfileString(data.username, 32)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const bio = safeProfileString(data.bio, 180);
  const avatar = safeAvatarUrl(data.avatar);
  if (!name) throw new Error("Display name is required.");
  if (!usernameInput) throw new Error("Username is required.");

  const existing = await prisma.communityUser.findUnique({ where: { id: userId } });
  if (!existing) throw new Error("User not found.");
  const usernameOwner = await prisma.communityUser.findUnique({ where: { username: usernameInput } });
  if (usernameOwner && usernameOwner.id !== userId) throw new Error("Username is already taken.");

  const row = await prisma.communityUser.update({
    where: { id: userId },
    data: {
      name,
      username: usernameInput,
      avatar,
      bio: bio || null,
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
  const content = await getContent();
  const ranking = content.communityPage;
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

  const rows = await prisma.communityIdea.findMany({
    where: context.isAdmin
      ? {}
      : context.userId
        ? { OR: [approvedPublicIdeaWhere, { authorId: context.userId }] }
        : approvedPublicIdeaWhere,
    orderBy,
    take: sort === "trending" ? 50 : safeLimit,
    include: ideaInclude
  });
  const ideas = rows.map((row) => ideaToCommunityIdea(row, {
    includeAdminFields: Boolean(context.isAdmin),
    ranking
  }));
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
  if (!Number.isInteger(index) || index < 0 || index > 4) return null;
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

  const [ideas, comments, reactions, receivedComments, receivedReactions, reviewedIdeas] = await Promise.all([
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
    })
  ]);

  const receivedLikes = receivedReactions.filter((reaction) => reaction.type === "Like").length;
  const receivedInterested = receivedReactions.filter((reaction) => reaction.type === "Interested").length;
  const isUnread = (value: Date | string | null | undefined) => {
    if (!lastSeenAt || !value) return true;
    return new Date(value).getTime() > lastSeenAt.getTime();
  };
  const unreadReceivedComments = receivedComments.filter((comment) => isUnread(comment.createdAt)).length;
  const unreadReceivedReactions = receivedReactions.filter((reaction) => isUnread(reaction.createdAt)).length;
  const unreadReviewedIdeas = reviewedIdeas.filter((idea) => isUnread(idea.review?.updatedAt || idea.updatedAt)).length;
  const unreadStatusIdeas = ideas.filter((idea) => idea.status !== "Discussing" && isUnread(idea.updatedAt)).length;
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
      title: `${reaction.user.name} ${reaction.type === "Interested" ? "is interested in" : "liked"} your idea`,
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
      joinedAt: iso(user.joinedAt)
    },
    stats: {
      ideasPosted: ideas.length,
      commentsMade: comments.length,
      likedIdeas: reactions.filter((reaction) => reaction.type === "Like").length,
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
      .filter((reaction) => reaction.type === "Like" && reaction.idea)
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
  const [receivedComments, receivedReactions, reviewedIdeas, statusIdeas] = await Promise.all([
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
    })
  ]);

  return receivedComments + receivedReactions + reviewedIdeas + statusIdeas;
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
  const country = typeof data.country === "string" ? data.country.trim().slice(0, 120) : "";
  if (!title || !description || !category || !country) {
    throw new Error("Title, description, category, and country are required.");
  }

  const visibility = normalizeVisibility(data.visibility);
  const publicConsent = data.publicContentConsent === true &&
    data.publicImageConsent === true &&
    data.publicAssessmentConsent === true;
  if (visibility === "Public" && !publicConsent) {
    throw new Error("Public ideas require consent for the post, uploaded images, and TYORA assessment to be displayed publicly.");
  }
  const submittedImageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls.map((item) => safePublicImageUrl(item)).filter((item): item is string => Boolean(item)).slice(0, 5)
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
      country,
      imageUrlsJson: JSON.stringify(imageUrls),
      questionsJson: JSON.stringify(normalizeQuestions(data.questions)),
      otherQuestion: typeof data.otherQuestion === "string" ? data.otherQuestion.trim().slice(0, 500) || null : null,
      visibility,
      moderationStatus: "Pending",
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
  type: "Like" | "Interested",
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
      const existing = await tx.communityReaction.findFirst({
        where: { ideaId: idea.id, userId, type }
      });
      if (existing) {
        await tx.communityReaction.delete({ where: { id: existing.id } });
      } else {
        await tx.communityReaction.create({
          data: { id: makeCommunityId("REACTION"), ideaId: idea.id, userId, type }
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
        where: { commentId: comment.id, userId, type: "Like" }
      });
      if (existing) {
        await tx.communityReaction.delete({ where: { id: existing.id } });
      } else {
        await tx.communityReaction.create({
          data: { id: makeCommunityId("REACTION"), commentId: comment.id, userId, type: "Like" }
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
    liked: reactions.some((reaction) => reaction.type === "Like"),
    interested: reactions.some((reaction) => reaction.type === "Interested")
  };
}

export async function updateCommunityIdeaOwner(slug: string, input: unknown, userId: string) {
  const existing = await prisma.communityIdea.findUnique({ where: { slug } });
  assertCanReadIdea(existing, { userId });
  if (existing.authorId !== userId) throw new IdeaNotFoundError();

  const data = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const title = typeof data.title === "string" ? data.title.trim().slice(0, 140) : existing.title;
  const description = typeof data.description === "string" ? data.description.trim().slice(0, 5000) : existing.description;
  const category = typeof data.category === "string" ? data.category.trim().slice(0, 120) : existing.category;
  const imageUrls = Array.isArray(data.imageUrls)
    ? await ownerIdeaImageUrls(data.imageUrls, existing.imageUrlsJson, existing.slug)
    : storedIdeaImageUrls(existing.imageUrlsJson);

  if (!title || !description || !category) throw new Error("Product name, category, and description are required.");

  await prisma.communityIdea.update({
    where: { slug },
    data: {
      title,
      description,
      category,
      imageUrlsJson: JSON.stringify(imageUrls),
      moderationStatus: "Pending",
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

export async function deleteCommunityIdeaAdmin(slug: string) {
  const existing = await prisma.communityIdea.findUnique({
    where: { slug },
    select: { id: true }
  });
  if (!existing) throw new Error("Idea not found.");

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
    await tx.communityIdea.delete({ where: { id: existing.id } });
  });

  return { slug };
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 3000) : null;
}

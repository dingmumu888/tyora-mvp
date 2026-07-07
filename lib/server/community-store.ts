import {
  CommunityFeedSort,
  CommunityIdea,
  CommunityQuestion,
  CommunityStatus,
  CommunityUser,
  makeCommunityId,
  normalizeQuestions,
  normalizeStatus,
  normalizeVisibility,
  slugifyCommunityIdea,
  usernameFromEmail
} from "@/lib/community";
import { prisma } from "@/lib/server/db";

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
  joinedAt: Date;
};

const MAX_INLINE_IDEA_IMAGE_LENGTH = 900000;
const MAX_INLINE_AVATAR_LENGTH = 120000;

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

function safePublicImageUrls(value: unknown) {
  const parsed = parseJson(value, []);
  return Array.isArray(parsed)
    ? parsed.map((item) => safePublicImageUrl(item)).filter((item): item is string => Boolean(item)).slice(0, 5)
    : [];
}

function iso(value: Date | string | null | undefined) {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : value;
}

function userPublic(user: UserRow) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    avatar: safePublicImageUrl(user.avatar, MAX_INLINE_AVATAR_LENGTH) || undefined,
    bio: user.bio || undefined,
    profileCompleted: Boolean(user.profileCompleted),
    country: user.country || undefined
  };
}

function ideaToCommunityIdea(row: any): CommunityIdea {
  const reactions = Array.isArray(row.reactions) ? row.reactions : [];
  const comments = Array.isArray(row.comments) ? row.comments : [];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    country: row.country,
    imageUrls: safePublicImageUrls(row.imageUrlsJson),
    questions: normalizeQuestions(parseJson(row.questionsJson, [])),
    otherQuestion: row.otherQuestion || undefined,
    visibility: normalizeVisibility(row.visibility),
    status: normalizeStatus(row.status),
    hidden: Boolean(row.hidden),
    locked: Boolean(row.locked),
    pinned: Boolean(row.pinned),
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
        createdAt: iso(comment.createdAt)
      })),
    review: row.review
      ? {
          id: row.review.id,
          manufacturingFeasible: row.review.manufacturingFeasible || undefined,
          estimatedCostRange: row.review.estimatedCostRange || undefined,
          suggestedMaterial: row.review.suggestedMaterial || undefined,
          estimatedMoq: row.review.estimatedMoq || undefined,
          suggestedManufacturing: row.review.suggestedManufacturing || undefined,
          factoriesMatched: row.review.factoriesMatched || undefined,
          additionalNotes: row.review.additionalNotes || undefined,
          createdAt: iso(row.review.createdAt),
          updatedAt: iso(row.review.updatedAt)
        }
      : undefined,
    likeCount: reactions.filter((reaction: any) => reaction.type === "Like").length,
    interestedCount: reactions.filter((reaction: any) => reaction.type === "Interested").length,
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
  reactions: true
} as const;

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

export async function getCommunityIdeas(sort: CommunityFeedSort = "newest", includeHidden = false) {
  const orderBy =
    sort === "recently-active" || sort === "latest-comments"
      ? { updatedAt: "desc" as const }
      : sort === "latest-tyora-reply"
        ? { review: { updatedAt: "desc" as const } }
        : sort === "trending"
          ? [{ pinned: "desc" as const }, { updatedAt: "desc" as const }]
          : { createdAt: "desc" as const };

  const rows = await prisma.communityIdea.findMany({
    where: includeHidden ? {} : { hidden: false, visibility: "Public" },
    orderBy,
    take: 50,
    include: ideaInclude
  });
  return rows.map(ideaToCommunityIdea);
}

export async function getCommunityIdeaBySlug(slug: string, includeHidden = false) {
  const row = await prisma.communityIdea.findUnique({
    where: { slug },
    include: ideaInclude
  });
  if (!row || (!includeHidden && (row.hidden || row.visibility !== "Public"))) return null;
  return ideaToCommunityIdea(row);
}

export async function getCommunityUserActivity(userId: string) {
  const user = await prisma.communityUser.findUnique({ where: { id: userId } });
  if (!user) return null;

  const [ideas, comments, reactions, receivedComments, receivedReactions, reviewedIdeas] = await Promise.all([
    prisma.communityIdea.findMany({
      where: { authorId: userId, hidden: false },
      orderBy: { updatedAt: "desc" },
      include: ideaInclude
    }),
    prisma.communityComment.findMany({
      where: { authorId: userId, hidden: false, idea: { hidden: false, visibility: "Public" } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        idea: {
          include: ideaInclude
        }
      }
    }),
    prisma.communityReaction.findMany({
      where: { userId, ideaId: { not: null }, idea: { hidden: false, visibility: "Public" } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        idea: {
          include: ideaInclude
        }
      }
    }),
    prisma.communityComment.findMany({
      where: { hidden: false, authorId: { not: userId }, idea: { authorId: userId, hidden: false } },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        author: true,
        idea: true
      }
    }),
    prisma.communityReaction.findMany({
      where: { userId: { not: userId }, ideaId: { not: null }, idea: { authorId: userId, hidden: false } },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        user: true,
        idea: true
      }
    }),
    prisma.communityIdea.findMany({
      where: { authorId: userId, hidden: false, review: { isNot: null } },
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
  const notifications = [
    ...receivedComments.map((comment) => ({
      id: `comment-${comment.id}`,
      type: "comment" as const,
      title: `${comment.author.name} commented on your idea`,
      body: comment.body,
      href: `/ask/${comment.idea.slug}`,
      createdAt: iso(comment.createdAt)
    })),
    ...receivedReactions.map((reaction) => ({
      id: `reaction-${reaction.id}`,
      type: reaction.type === "Interested" ? "interested" as const : "like" as const,
      title: `${reaction.user.name} ${reaction.type === "Interested" ? "is interested in" : "liked"} your idea`,
      body: reaction.idea?.title || "Your idea",
      href: reaction.idea ? `/ask/${reaction.idea.slug}` : "/ask",
      createdAt: iso(reaction.createdAt)
    })),
    ...reviewedIdeas.map((idea) => ({
      id: `review-${idea.id}`,
      type: "review" as const,
      title: "TYORA reviewed your idea",
      body: idea.title,
      href: `/ask/${idea.slug}`,
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
      notifications: notifications.length
    },
    ideas: ideas.map(ideaToCommunityIdea),
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

  const imageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls.map((item) => safePublicImageUrl(item)).filter((item): item is string => Boolean(item)).slice(0, 5)
    : [];
  if (imageUrls.length > 5) throw new Error("Upload a maximum of 5 images.");

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
      visibility: normalizeVisibility(data.visibility),
      status: "Discussing",
      authorId
    },
    include: ideaInclude
  });
  return ideaToCommunityIdea(row);
}

export async function addCommunityComment(slug: string, input: unknown, authorId: string) {
  const idea = await prisma.communityIdea.findUnique({ where: { slug } });
  if (!idea || idea.hidden) throw new Error("Idea not found.");
  if (idea.locked) throw new Error("Comments are locked for this idea.");
  const data = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const body = typeof data.body === "string" ? data.body.trim().slice(0, 1600) : "";
  if (!body) throw new Error("Comment is required.");
  const parentId = typeof data.parentId === "string" ? data.parentId : null;

  await prisma.communityComment.create({
    data: {
      id: makeCommunityId("COMMENT"),
      body,
      parentId,
      ideaId: idea.id,
      authorId
    }
  });
  await prisma.communityIdea.update({
    where: { id: idea.id },
    data: { updatedAt: new Date() }
  });
  return getCommunityIdeaBySlug(slug, true);
}

export async function toggleCommunityReaction(slug: string, type: "Like" | "Interested", userId: string) {
  const idea = await prisma.communityIdea.findUnique({ where: { slug } });
  if (!idea || idea.hidden) throw new Error("Idea not found.");
  const existing = await prisma.communityReaction.findFirst({
    where: { ideaId: idea.id, userId, type }
  });
  if (existing) {
    await prisma.communityReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.communityReaction.create({
      data: {
        id: makeCommunityId("REACTION"),
        ideaId: idea.id,
        userId,
        type
      }
    });
  }
  await prisma.communityIdea.update({
    where: { id: idea.id },
    data: { updatedAt: new Date() }
  });
  return getCommunityIdeaBySlug(slug, true);
}

export async function updateCommunityIdeaAdmin(slug: string, input: unknown) {
  const existing = await prisma.communityIdea.findUnique({
    where: { slug },
    include: { review: true }
  });
  if (!existing) throw new Error("Idea not found.");
  const data = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const review = data.review && typeof data.review === "object" && !Array.isArray(data.review)
    ? (data.review as Record<string, unknown>)
    : {};

  await prisma.communityIdea.update({
    where: { slug },
    data: {
      status: normalizeStatus(data.status),
      hidden: typeof data.hidden === "boolean" ? data.hidden : existing.hidden,
      locked: typeof data.locked === "boolean" ? data.locked : existing.locked,
      pinned: typeof data.pinned === "boolean" ? data.pinned : existing.pinned
    }
  });

  if (Object.keys(review).length > 0) {
    await prisma.tyoraReview.upsert({
      where: { ideaId: existing.id },
      create: {
        id: makeCommunityId("REVIEW"),
        ideaId: existing.id,
        manufacturingFeasible: stringOrNull(review.manufacturingFeasible),
        estimatedCostRange: stringOrNull(review.estimatedCostRange),
        suggestedMaterial: stringOrNull(review.suggestedMaterial),
        estimatedMoq: stringOrNull(review.estimatedMoq),
        suggestedManufacturing: stringOrNull(review.suggestedManufacturing),
        factoriesMatched: stringOrNull(review.factoriesMatched),
        additionalNotes: stringOrNull(review.additionalNotes)
      },
      update: {
        manufacturingFeasible: stringOrNull(review.manufacturingFeasible),
        estimatedCostRange: stringOrNull(review.estimatedCostRange),
        suggestedMaterial: stringOrNull(review.suggestedMaterial),
        estimatedMoq: stringOrNull(review.estimatedMoq),
        suggestedManufacturing: stringOrNull(review.suggestedManufacturing),
        factoriesMatched: stringOrNull(review.factoriesMatched),
        additionalNotes: stringOrNull(review.additionalNotes)
      }
    });
  }

  return getCommunityIdeaBySlug(slug, true);
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 3000) : null;
}

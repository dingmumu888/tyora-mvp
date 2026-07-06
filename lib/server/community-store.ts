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
  country: string | null;
  joinedAt: Date;
};

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
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
    avatar: user.avatar || undefined,
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
    imageUrls: parseJson(row.imageUrlsJson, []),
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
        country: row.country || undefined,
        joinedAt: iso(row.joinedAt)
      }
    : null;
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
    ? data.imageUrls.filter((item): item is string => typeof item === "string").slice(0, 5)
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

export const ideaModerationStatuses = ["Pending", "Approved", "Rejected", "Draft"] as const;

export type IdeaModerationStatus = (typeof ideaModerationStatuses)[number];

export type IdeaAccessRecord = {
  authorId: string;
  visibility: string;
  moderationStatus?: string | null;
  status?: string | null;
  hidden: boolean;
};

export type IdeaAccessContext = {
  userId?: string | null;
  isAdmin?: boolean;
};

const restrictedLegacyStatuses = new Set(["pending", "rejected", "draft"]);

export function normalizeIdeaModerationStatus(value: unknown): IdeaModerationStatus {
  return ideaModerationStatuses.includes(value as IdeaModerationStatus)
    ? (value as IdeaModerationStatus)
    : "Pending";
}

export function isApprovedPublicIdea(idea: IdeaAccessRecord) {
  const moderationStatus = normalizeIdeaModerationStatus(idea.moderationStatus);
  const legacyStatus = (idea.status || "").trim().toLowerCase();
  return (
    !idea.hidden &&
    idea.visibility === "Public" &&
    moderationStatus === "Approved" &&
    !restrictedLegacyStatuses.has(legacyStatus)
  );
}

export function canReadIdea(idea: IdeaAccessRecord, context: IdeaAccessContext = {}) {
  if (isApprovedPublicIdea(idea)) return true;
  if (context.isAdmin) return true;
  return Boolean(context.userId && context.userId === idea.authorId);
}

export function canInteractWithIdea(idea: IdeaAccessRecord, context: IdeaAccessContext = {}) {
  return canReadIdea(idea, context);
}

export class IdeaNotFoundError extends Error {
  constructor() {
    super("Idea not found.");
    this.name = "IdeaNotFoundError";
  }
}

export function assertCanReadIdea<T extends IdeaAccessRecord>(
  idea: T | null | undefined,
  context: IdeaAccessContext = {}
): asserts idea is T {
  if (!idea || !canReadIdea(idea, context)) throw new IdeaNotFoundError();
}

export function assertCanInteractWithIdea<T extends IdeaAccessRecord>(
  idea: T | null | undefined,
  context: IdeaAccessContext = {}
): asserts idea is T {
  if (!idea || !canInteractWithIdea(idea, context)) throw new IdeaNotFoundError();
}

export function isIdeaNotFoundError(error: unknown): error is IdeaNotFoundError {
  return error instanceof IdeaNotFoundError;
}

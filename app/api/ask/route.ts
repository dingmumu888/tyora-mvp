import { ASK_STATUSES, normalizeAskIdea } from "@/lib/ask";
import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { countAskReviewsForEmailToday, createAskIdea, getAskIdeas } from "@/lib/server/data-store";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateAskSubmission(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Invalid Ask TYORA submission.";
  }

  const raw = body as Record<string, unknown>;
  const idea = normalizeAskIdea(body);
  if (typeof raw.productName !== "string" || !raw.productName.trim()) return "Product name is required.";
  if (typeof raw.category !== "string" || !raw.category.trim()) return "Category is required.";
  if (typeof raw.country !== "string" || !raw.country.trim()) return "Country is required.";
  if (typeof raw.description !== "string" || !raw.description.trim()) return "Description is required.";
  if (!idea.email || !emailPattern.test(idea.email)) return "A valid email is required.";
  if (Array.isArray(raw.imageNames) && raw.imageNames.length > 5) return "Upload a maximum of 5 images.";
  if (!ASK_STATUSES.includes(idea.status)) return "Invalid Ask TYORA status.";

  return null;
}

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await getAskIdeas());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load Ask TYORA submissions."));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationError = validateAskSubmission(body);
    if (validationError) return fail(validationError, 400);

    const idea = normalizeAskIdea(body);
    const usedToday = await countAskReviewsForEmailToday(idea.email);
    if (usedToday >= 3) {
      return fail("You have used 3 TYORA Expert Reviews today. Community discussion remains unlimited.", 429);
    }

    return ok(await createAskIdea(idea));
  } catch (error) {
    return fail(messageFromError(error, "Unable to submit Ask TYORA request."));
  }
}

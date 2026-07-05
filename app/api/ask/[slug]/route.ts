import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { getAskIdeaBySlug, updateAskIdea } from "@/lib/server/data-store";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const idea = await getAskIdeaBySlug(slug);
    if (!idea) return fail("Ask TYORA idea not found.", 404);
    if (idea.visibility === "Private") {
      const unauthorized = await requireAdminSession();
      if (unauthorized) return unauthorized;
    }
    return ok(idea);
  } catch (error) {
    return fail(messageFromError(error, "Unable to load Ask TYORA idea."));
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { slug } = await params;

  try {
    return ok(await updateAskIdea(slug, await request.json()));
  } catch (error) {
    return fail(messageFromError(error, "Unable to update Ask TYORA idea."));
  }
}

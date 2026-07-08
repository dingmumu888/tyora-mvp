import { requireAdminSession } from "@/lib/server/admin-auth";
import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { deleteCommunityIdeaAdmin, updateCommunityIdeaAdmin } from "@/lib/server/community-store";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  const { slug } = await params;
  try {
    return ok(await updateCommunityIdeaAdmin(slug, await request.json()));
  } catch (error) {
    return fail(messageFromError(error, "Unable to update community idea."), 400);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  const { slug } = await params;
  try {
    return ok(await deleteCommunityIdeaAdmin(slug));
  } catch (error) {
    return fail(messageFromError(error, "Unable to delete community idea."), 400);
  }
}

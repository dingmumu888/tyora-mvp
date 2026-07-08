import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { updateSourceRequest } from "@/lib/server/source-store";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    return ok(await updateSourceRequest(id, await request.json().catch(() => ({}))));
  } catch (error) {
    return fail(messageFromError(error, "Unable to update source request."), 400);
  }
}

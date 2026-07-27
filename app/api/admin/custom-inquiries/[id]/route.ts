import { requireAdminSession } from "@/lib/server/admin-auth";
import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { updateCustomInquiryAdmin } from "@/lib/server/custom-inquiry-store";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    return ok(await updateCustomInquiryAdmin(id, await request.json()), {
      headers: { "Cache-Control": "private, no-store" }
    });
  } catch (error) {
    return fail(messageFromError(error, "Unable to update Custom inquiry."), 400);
  }
}

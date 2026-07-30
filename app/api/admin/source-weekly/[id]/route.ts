import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import {
  deleteWeeklySourceProduct,
  updateWeeklySourceProduct
} from "@/lib/server/source-weekly-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    return ok(await updateWeeklySourceProduct(id, await request.json().catch(() => ({}))));
  } catch (error) {
    return fail(messageFromError(error, "Unable to update weekly product."), 400);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    return ok(await deleteWeeklySourceProduct(id));
  } catch (error) {
    return fail(messageFromError(error, "Unable to delete weekly product."), 400);
  }
}

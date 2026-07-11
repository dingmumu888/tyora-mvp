import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { getWorkOrders, updateWorkOrder } from "@/lib/server/work-order-store";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  return ok(await getWorkOrders());
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  try {
    return ok(await updateWorkOrder(await request.json()));
  } catch (error) {
    return fail(messageFromError(error, "Unable to update work order."));
  }
}

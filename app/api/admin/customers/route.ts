import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { getAdminCustomers } from "@/lib/server/customer-store";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await getAdminCustomers());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load customers."));
  }
}

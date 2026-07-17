import { requireAdminSession } from "@/lib/server/admin-auth";
import { ok } from "@/lib/server/api-response";
import { getAllCustomInquiriesAdmin } from "@/lib/server/custom-inquiry-store";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  return ok(await getAllCustomInquiriesAdmin(), {
    headers: { "Cache-Control": "private, no-store" }
  });
}

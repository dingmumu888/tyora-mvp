import { requireAdminSession } from "@/lib/server/admin-auth";
import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { getLeads, putLeads } from "@/lib/server/data-store";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await getLeads());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load project submissions."));
  }
}

export async function PUT(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await putLeads(await request.json()));
  } catch (error) {
    return fail(messageFromError(error, "Unable to save project submissions."));
  }
}

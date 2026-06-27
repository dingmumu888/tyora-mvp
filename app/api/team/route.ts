import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { getTeamMembers, putTeamMembers } from "@/lib/server/data-store";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await getTeamMembers());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load team members."));
  }
}

export async function PUT(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await putTeamMembers(await request.json()));
  } catch (error) {
    return fail(messageFromError(error, "Unable to save team members."));
  }
}

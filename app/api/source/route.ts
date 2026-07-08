import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { createSourceRequest, getSourceRequests } from "@/lib/server/source-store";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await getSourceRequests());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load source requests."));
  }
}

export async function POST(request: Request) {
  try {
    return ok(await createSourceRequest(await request.json()));
  } catch (error) {
    return fail(messageFromError(error, "Unable to submit source request."), 400);
  }
}

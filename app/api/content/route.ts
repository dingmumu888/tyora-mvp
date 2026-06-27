import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { getContent, putContent, resetStoredContent } from "@/lib/server/data-store";

export async function GET() {
  try {
    return ok(await getContent());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load website content."));
  }
}

export async function PUT(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await putContent(await request.json()));
  } catch (error) {
    return fail(messageFromError(error, "Unable to save website content."));
  }
}

export async function DELETE() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await resetStoredContent());
  } catch (error) {
    return fail(messageFromError(error, "Unable to reset website content."));
  }
}

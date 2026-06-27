import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { getMedia, putMedia } from "@/lib/server/data-store";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await getMedia());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load media library."));
  }
}

export async function PUT(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await putMedia(await request.json()));
  } catch (error) {
    return fail(messageFromError(error, "Unable to save media library."));
  }
}

export async function DELETE() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  return fail("Method not allowed.", 405);
}

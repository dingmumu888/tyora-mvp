import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { getContent, putContent } from "@/lib/server/data-store";

export async function GET() {
  try {
    return ok(await getContent(), {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300"
      }
    });
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

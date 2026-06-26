import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { getMedia, putMedia } from "@/lib/server/data-store";

export async function GET() {
  try {
    return ok(await getMedia());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load media library."));
  }
}

export async function PUT(request: Request) {
  try {
    return ok(await putMedia(await request.json()));
  } catch (error) {
    return fail(messageFromError(error, "Unable to save media library."));
  }
}

import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { getSourceRequestStats } from "@/lib/server/source-store";

export async function GET() {
  try {
    return ok(await getSourceRequestStats());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load source stats."));
  }
}

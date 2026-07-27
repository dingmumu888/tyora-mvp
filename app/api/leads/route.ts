import { fail, ok } from "@/lib/server/api-response";
import { createPublicLead } from "@/lib/server/data-store";
import { readPublicLeadRequest } from "@/lib/server/lead-submission-policy";
import { isAllowedPrivateFileAccessUrl } from "@/lib/server/private-storage-policy";

export async function POST(request: Request) {
  try {
    const parsed = await readPublicLeadRequest(request, isAllowedPrivateFileAccessUrl);
    if ("error" in parsed) {
      return fail(parsed.error, parsed.status);
    }
    const lead = await createPublicLead(parsed.data);
    return ok({ id: lead.id, submitted: true });
  } catch {
    return fail("Unable to save project submission.");
  }
}

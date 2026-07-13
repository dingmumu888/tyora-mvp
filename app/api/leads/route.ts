import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { createLead, getLeads, putLeads } from "@/lib/server/data-store";
import { validatePublicLeadSubmission } from "@/lib/server/lead-submission-policy";
import { isAllowedPrivateFileAccessUrl } from "@/lib/server/private-storage-policy";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await getLeads());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load project submissions."));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationError = validatePublicLeadSubmission(body, isAllowedPrivateFileAccessUrl);
    if (validationError) {
      return fail(validationError, 400);
    }

    return ok(await createLead(body));
  } catch (error) {
    return fail(messageFromError(error, "Unable to save project submission."));
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

import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { createLead, getLeads, putLeads } from "@/lib/server/data-store";

export async function GET() {
  try {
    return ok(await getLeads());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load project submissions."));
  }
}

export async function POST(request: Request) {
  try {
    return ok(await createLead(await request.json()));
  } catch (error) {
    return fail(messageFromError(error, "Unable to save project submission."));
  }
}

export async function PUT(request: Request) {
  try {
    return ok(await putLeads(await request.json()));
  } catch (error) {
    return fail(messageFromError(error, "Unable to save project submissions."));
  }
}

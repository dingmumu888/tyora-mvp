import { requireAdminSession } from "@/lib/server/admin-auth";
import { fail, ok } from "@/lib/server/api-response";
import { getSubmissionWorkflowAdmin } from "@/lib/server/submission-workflow-store";
import { SubmissionWorkflowPolicyError } from "@/lib/server/submission-workflow-policy";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    return ok(await getSubmissionWorkflowAdmin(id), {
      headers: { "Cache-Control": "private, no-store" }
    });
  } catch (error) {
    if (error instanceof SubmissionWorkflowPolicyError) {
      return fail(error.message, error.status);
    }
    return fail("Unable to load workflow.", 500);
  }
}

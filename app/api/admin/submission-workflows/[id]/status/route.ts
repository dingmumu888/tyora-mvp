import { requireAdminSession } from "@/lib/server/admin-auth";
import { fail, ok } from "@/lib/server/api-response";
import { transitionSubmissionWorkflowAdmin } from "@/lib/server/submission-workflow-store";
import { SubmissionWorkflowPolicyError } from "@/lib/server/submission-workflow-policy";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    return ok(await transitionSubmissionWorkflowAdmin({
      workflowId: id,
      newStatus: body.newStatus,
      note: body.note,
      idempotencyKey: request.headers.get("idempotency-key")
    }), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof SubmissionWorkflowPolicyError) {
      return fail(error.message, error.status);
    }
    return fail("Unable to update workflow status.", 500);
  }
}

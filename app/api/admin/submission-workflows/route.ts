import { requireAdminSession } from "@/lib/server/admin-auth";
import { fail, ok } from "@/lib/server/api-response";
import {
  ensureSubmissionWorkflowAdmin,
  listSubmissionWorkflowsAdmin
} from "@/lib/server/submission-workflow-store";
import { SubmissionWorkflowPolicyError } from "@/lib/server/submission-workflow-policy";

function failure(error: unknown) {
  if (error instanceof SubmissionWorkflowPolicyError) {
    return fail(error.message, error.status);
  }
  return fail("Unable to process workflow.", 500);
}

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  try {
    return ok(await listSubmissionWorkflowsAdmin(), {
      headers: { "Cache-Control": "private, no-store" }
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json() as Record<string, unknown>;
    return ok(await ensureSubmissionWorkflowAdmin({
      recordKind: body.recordKind,
      sourceId: body.sourceId,
      idempotencyKey: request.headers.get("idempotency-key")
    }), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return failure(error);
  }
}

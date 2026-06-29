import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { getAnalyticsDashboard, recordAnalyticsEvent } from "@/lib/server/analytics-store";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await getAnalyticsDashboard());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load analytics."));
  }
}

export async function POST(request: Request) {
  try {
    await recordAnalyticsEvent(await request.json(), request);
    return ok({ recorded: true });
  } catch (error) {
    return fail(messageFromError(error, "Unable to record analytics event."), 400);
  }
}

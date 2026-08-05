import { timingSafeEqual } from "node:crypto";
import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { cleanupWeeklySourceProducts } from "@/lib/server/source-weekly-store";
import {
  cleanupExpiredCommunityImageUploads,
  cleanupPendingCommunityPrivateObjects
} from "@/lib/server/community-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const provided = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length
    && timingSafeEqual(providedBytes, expectedBytes);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return fail("Cron cleanup is not configured.", 503);
  }
  if (!authorized(request)) return fail("Unauthorized.", 401);

  try {
    const [sourceWeekly, pendingCommunityPrivateObjects, expiredCommunityImageUploads] = await Promise.all([
      cleanupWeeklySourceProducts(),
      cleanupPendingCommunityPrivateObjects(),
      cleanupExpiredCommunityImageUploads()
    ]);
    return ok({ sourceWeekly, pendingCommunityPrivateObjects, expiredCommunityImageUploads });
  } catch (error) {
    return fail(messageFromError(error, "Scheduled cleanup failed."));
  }
}

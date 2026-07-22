import { fail, ok } from "@/lib/server/api-response";
import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { CustomInquiryNotFoundError } from "@/lib/server/custom-inquiry-policy";
import { addCustomInquiryFile } from "@/lib/server/custom-inquiry-store";
import { PrivateStorageProviderError } from "@/lib/server/private-storage";
import { PrivateUploadValidationError } from "@/lib/server/private-storage-policy";
import {
  createPrivateUploadRateLimiter,
  PrivateUploadRequestError,
  validatePrivateUploadRequest
} from "@/lib/server/private-upload-request-policy";

export const runtime = "nodejs";
const enforceRateLimit = createPrivateUploadRateLimiter({ limit: 5 });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCommunitySession();
  if (!session) return fail("Not found.", 404);
  try {
    validatePrivateUploadRequest(request);
    enforceRateLimit(request);
    const { id } = await params;
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return fail("Missing file.", 400);
    const result = await addCustomInquiryFile(id, file, session.userId);
    return refreshCommunitySessionCookieIfNeeded(ok(result, {
      headers: { "Cache-Control": "private, no-store" }
    }), session);
  } catch (error) {
    if (error instanceof CustomInquiryNotFoundError) return fail("Not found.", 404);
    if (error instanceof PrivateUploadRequestError) return fail(error.message, error.status);
    if (error instanceof PrivateUploadValidationError) return fail(error.message, 400);
    if (error instanceof PrivateStorageProviderError) {
      return fail("Private Custom storage is temporarily unavailable.", 503);
    }
    return fail("Unable to upload private Custom file.", 503);
  }
}

import { fail, ok } from "@/lib/server/api-response";
import {
  buildPrivateFileAccessUrl,
  buildPrivateObjectPath,
  PrivateUploadValidationError,
  validatePrivateUploadFile
} from "@/lib/server/private-storage-policy";
import {
  PrivateStorageProviderError,
  uploadPrivateObject
} from "@/lib/server/private-storage";
import {
  createPrivateUploadRateLimiter,
  PrivateUploadRequestError,
  validatePrivateUploadRequest
} from "@/lib/server/private-upload-request-policy";

export const runtime = "nodejs";
const enforcePrivateUploadRateLimit = createPrivateUploadRateLimiter();

export async function POST(request: Request) {
  try {
    validatePrivateUploadRequest(request);
    enforcePrivateUploadRateLimit(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("Missing file.", 400);
    }

    const validated = await validatePrivateUploadFile(file);
    const objectPath = buildPrivateObjectPath(validated.extension);
    await uploadPrivateObject(objectPath, await file.arrayBuffer(), file.type);

    return ok({
      name: validated.displayName,
      url: buildPrivateFileAccessUrl(objectPath)
    });
  } catch (error) {
    if (error instanceof PrivateUploadRequestError) {
      return fail(error.message, error.status);
    }
    if (error instanceof PrivateUploadValidationError) {
      return fail(error.message, 400);
    }
    if (error instanceof PrivateStorageProviderError) {
      return fail("Private project storage is temporarily unavailable.", 503);
    }
    return fail("Unable to upload project file.", 503);
  }
}

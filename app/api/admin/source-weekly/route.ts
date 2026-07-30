import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { uploadWeeklySourceImage, deleteWeeklySourceImage } from "@/lib/server/source-weekly-image";
import {
  createWeeklySourceProduct,
  getAdminWeeklySourceProducts
} from "@/lib/server/source-weekly-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formValues(formData: FormData) {
  return {
    productCode: formData.get("productCode"),
    title: formData.get("title"),
    titleZh: formData.get("titleZh"),
    summary: formData.get("summary"),
    summaryZh: formData.get("summaryZh"),
    factoryPrice: formData.get("factoryPrice"),
    moq: formData.get("moq"),
    publishNow: formData.get("publishNow") === "true"
  };
}

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await getAdminWeeklySourceProducts());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load weekly products."));
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  let uploadedPath = "";
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) return fail("Product image is required.", 400);

    const uploaded = await uploadWeeklySourceImage(file);
    uploadedPath = uploaded.imageObjectPath;
    return ok(await createWeeklySourceProduct({
      ...formValues(formData),
      ...uploaded
    }));
  } catch (error) {
    if (uploadedPath) await deleteWeeklySourceImage(uploadedPath).catch(() => undefined);
    return fail(messageFromError(error, "Unable to create weekly product."), 400);
  }
}

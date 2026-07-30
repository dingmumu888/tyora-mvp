import { NextRequest } from "next/server";
import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { recordWeeklySourceInterest } from "@/lib/server/source-weekly-store";

const visitorCookie = "tyora-source-interest";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await request.json().catch(() => ({})) as { language?: unknown };
    const existingVisitor = request.cookies.get(visitorCookie)?.value;
    const visitorId = existingVisitor || crypto.randomUUID();
    const language = typeof payload.language === "string" ? payload.language : "en";
    const response = ok(await recordWeeklySourceInterest(id, visitorId, language));

    if (!existingVisitor) {
      response.cookies.set(visitorCookie, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 365 * 24 * 60 * 60
      });
    }
    return response;
  } catch (error) {
    return fail(messageFromError(error, "Unable to open this product."), 400);
  }
}

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { EmailDeliveryPolicyError } from "@/lib/server/email-delivery-policy";
import { EmailLoginStage, ResendEmailError, requestEmailLoginCode } from "@/lib/server/email-login";

function safeError(error: unknown) {
  if (error instanceof EmailDeliveryPolicyError) {
    return { name: error.name, code: error.code };
  }
  if (error instanceof ResendEmailError) {
    return { name: error.name };
  }
  return {
    name: error instanceof Error ? error.name : "UnknownError"
  };
}

function safeTraceData(data?: Record<string, unknown>) {
  if (!data) return {};
  const allowed = ["inputType", "valid", "recent", "limit", "limited", "created", "deployment", "senderKind"];
  return Object.fromEntries(allowed.filter((key) => key in data).map((key) => [key, data[key]]));
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-vercel-id") || randomUUID();
  let lastStage: EmailLoginStage | "route_start" = "route_start";

  try {
    const body = (await request.json()) as { email?: string };
    await requestEmailLoginCode(body.email, (stage, data) => {
      lastStage = stage;
      console.info(
        "[email-login-request] stage",
        JSON.stringify({ requestId, currentStage: stage, ...safeTraceData(data) })
      );
    });
  } catch (error) {
    console.error(
      "[email-login-request] failed",
      JSON.stringify({ requestId, lastStage, ...safeError(error) })
    );
    return NextResponse.json(
      { success: false, message: "Email login is temporarily unavailable." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "If the email can receive TYORA login codes, a code has been sent."
  });
}

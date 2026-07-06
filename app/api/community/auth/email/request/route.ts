import { NextResponse } from "next/server";
import { EmailLoginStage, getEmailLoginDebugContext, requestEmailLoginCode } from "@/lib/server/email-login";

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    };
  }

  return {
    name: typeof error,
    message: String(error),
    stack: null,
    cause: null
  };
}

export async function POST(request: Request) {
  let lastStage: EmailLoginStage | "route_start" = "route_start";
  try {
    const body = await request.json() as { email?: string };
    await requestEmailLoginCode(body.email, (stage, data) => {
      lastStage = stage;
      console.info("[email-login-request] stage", JSON.stringify({ stage, ...data }));
    });
  } catch (error) {
    const debug = getEmailLoginDebugContext();
    const serializedError = serializeError(error);
    console.error(
      "[email-login-request] failed",
      JSON.stringify({
        hasResendApiKey: debug.hasResendApiKey,
        hasAuthOrigin: debug.hasAuthOrigin,
        configuredSender: debug.configuredSender,
        actualSender: debug.actualSender,
        resendUseTestSender: debug.resendUseTestSender,
        lastStage,
        error: serializedError,
        stack: serializedError.stack
      }),
      error
    );
    return NextResponse.json({ success: false, message: "Email login is temporarily unavailable." }, { status: 503 });
  }

  return NextResponse.json({
    success: true,
    message: "If the email can receive TYORA login codes, a code has been sent."
  });
}

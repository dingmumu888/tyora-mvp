import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { EmailLoginStage, ResendEmailError, getEmailLoginDebugContext, requestEmailLoginCode } from "@/lib/server/email-login";

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      resend: error instanceof ResendEmailError ? {
        httpStatus: error.status,
        statusText: error.statusText,
        headers: error.responseHeaders,
        errorCode: error.errorCode,
        responseBody: error.responseBody
      } : null
    };
  }

  return {
    name: typeof error,
    message: String(error),
    stack: null,
    cause: null
  };
}

function logSenderMode(requestId: string) {
  const debug = getEmailLoginDebugContext();
  if (debug.actualSender === "onboarding@resend.dev") {
    console.warn(`[email-login]
Request ID: ${requestId}
⚠ Using Resend TEST sender
Current sender:
onboarding@resend.dev
Expected production sender:
TYORA <login@tyora.io>
Reason:
Production domain has not been fully switched yet.`);
    return;
  }

  if (debug.actualSender === "TYORA <login@tyora.io>") {
    console.info(`[email-login]
Request ID: ${requestId}
✓ Using VERIFIED TYORA sender
Sender:
TYORA <login@tyora.io>`);
  }
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-vercel-id") || randomUUID();
  let lastStage: EmailLoginStage | "route_start" = "route_start";
  let recipient = "";
  try {
    logSenderMode(requestId);
    const debug = getEmailLoginDebugContext();
    const body = await request.json() as { email?: string };
    await requestEmailLoginCode(body.email, (stage, data) => {
      lastStage = stage;
      const stageRecipient = typeof data?.email === "string" ? data.email : recipient;
      recipient = stageRecipient;
      const logPayload = {
        requestId,
        recipient: stageRecipient,
        configuredSender: debug.configuredSender,
        actualSender: debug.actualSender,
        usingResendTestSender: debug.actualSender === "onboarding@resend.dev",
        authOrigin: debug.authOrigin,
        environment: debug.environment,
        currentStage: stage,
        ...data
      };
      console.info("[email-login-request] stage", JSON.stringify(logPayload));
      if (stage === "after_resend_fetch" && data?.ok === true) {
        console.info("[email-login] SUCCESS", JSON.stringify({
          requestId,
          recipient: stageRecipient,
          sender: debug.actualSender,
          provider: "Resend",
          stage
        }));
      }
    });
  } catch (error) {
    const debug = getEmailLoginDebugContext();
    const serializedError = serializeError(error);
    const resend = serializedError.resend;
    console.error(
      "[email-login-request] failed",
      JSON.stringify({
        requestId,
        recipient,
        hasResendApiKey: debug.hasResendApiKey,
        hasAuthOrigin: debug.hasAuthOrigin,
        configuredSender: debug.configuredSender,
        actualSender: debug.actualSender,
        usingResendTestSender: debug.actualSender === "onboarding@resend.dev",
        authOrigin: debug.authOrigin,
        environment: debug.environment,
        resendUseTestSender: debug.resendUseTestSender,
        httpStatus: resend?.httpStatus ?? null,
        headers: resend?.headers ?? null,
        errorCode: resend?.errorCode ?? null,
        responseBody: resend?.responseBody ?? null,
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

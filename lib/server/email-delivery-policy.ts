const PRODUCTION_FROM = "TYORA <login@tyora.io>";
const PREVIEW_TEST_ADDRESS = "onboarding@resend.dev";
const PREVIEW_FROM = `TYORA Preview <${PREVIEW_TEST_ADDRESS}>`;

export type EmailDeployment = "production" | "preview" | "development" | "unknown";

export type EmailDeliveryEnvironment = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  RESEND_USE_TEST_SENDER?: string;
  RESEND_PREVIEW_RECIPIENTS?: string;
};

export type EmailDeliveryPlan = {
  deployment: EmailDeployment;
  sender: string;
  recipient: string;
};

export type EmailDeliveryPolicyErrorCode =
  | "email_not_configured"
  | "email_environment_unknown"
  | "preview_email_disabled"
  | "preview_sender_not_safe"
  | "preview_recipient_not_allowed";

export class EmailDeliveryPolicyError extends Error {
  code: EmailDeliveryPolicyErrorCode;

  constructor(code: EmailDeliveryPolicyErrorCode) {
    super("Email delivery is not available in this environment.");
    this.name = "EmailDeliveryPolicyError";
    this.code = code;
  }
}

function normalize(value: string | undefined) {
  return value?.trim() || "";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function senderAddress(value: string) {
  const bracketed = value.match(/<([^<>]+)>\s*$/)?.[1];
  return normalizeEmail(bracketed || value);
}

function previewRecipients(value: string | undefined) {
  return new Set(
    normalize(value)
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean)
  );
}

export function classifyEmailDeployment(environment: EmailDeliveryEnvironment): EmailDeployment {
  const vercelEnvironment = normalize(environment.VERCEL_ENV).toLowerCase();
  if (vercelEnvironment === "production") return "production";
  if (vercelEnvironment === "preview") return "preview";
  if (vercelEnvironment === "development") return "development";
  if (vercelEnvironment) return "unknown";
  return environment.NODE_ENV === "production" ? "production" : "development";
}

export function resolveEmailDeliveryPlan(
  recipientInput: string,
  environment: EmailDeliveryEnvironment
): EmailDeliveryPlan {
  const deployment = classifyEmailDeployment(environment);
  const recipient = normalizeEmail(recipientInput);
  const apiKeyPresent = Boolean(normalize(environment.RESEND_API_KEY));
  const configuredSender = normalize(environment.RESEND_FROM) || PRODUCTION_FROM;

  if (deployment === "unknown") {
    throw new EmailDeliveryPolicyError("email_environment_unknown");
  }
  if (deployment === "preview") {
    if (!apiKeyPresent || environment.RESEND_USE_TEST_SENDER !== "true") {
      throw new EmailDeliveryPolicyError("preview_email_disabled");
    }
    if (configuredSender !== PREVIEW_FROM) {
      throw new EmailDeliveryPolicyError("preview_sender_not_safe");
    }
    if (!previewRecipients(environment.RESEND_PREVIEW_RECIPIENTS).has(recipient)) {
      throw new EmailDeliveryPolicyError("preview_recipient_not_allowed");
    }
  } else if (!apiKeyPresent) {
    throw new EmailDeliveryPolicyError("email_not_configured");
  }

  return {
    deployment,
    sender:
      deployment === "production" && senderAddress(configuredSender) === PREVIEW_TEST_ADDRESS
        ? PRODUCTION_FROM
        : deployment === "development" && environment.RESEND_USE_TEST_SENDER === "true"
        ? PREVIEW_TEST_ADDRESS
        : configuredSender,
    recipient
  };
}

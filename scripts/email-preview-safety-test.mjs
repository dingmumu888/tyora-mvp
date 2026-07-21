import assert from "node:assert/strict";
import test from "node:test";

import {
  EmailDeliveryPolicyError,
  classifyEmailDeployment,
  resolveEmailDeliveryPlan
} from "../lib/server/email-delivery-policy.ts";

const previewBase = {
  NODE_ENV: "production",
  VERCEL_ENV: "preview",
  RESEND_API_KEY: "preview-key-present",
  RESEND_FROM: "TYORA Preview <onboarding@resend.dev>",
  RESEND_USE_TEST_SENDER: "true",
  RESEND_PREVIEW_RECIPIENTS: "owner@example.com"
};

test("VERCEL_ENV preview takes precedence over NODE_ENV production", () => {
  assert.equal(classifyEmailDeployment(previewBase), "preview");
});

test("an unknown VERCEL_ENV fails closed instead of inheriting Production behavior", () => {
  const environment = { ...previewBase, VERCEL_ENV: "unexpected-environment" };
  assert.equal(classifyEmailDeployment(environment), "unknown");
  assert.throws(
    () => resolveEmailDeliveryPlan("owner@example.com", environment),
    (error) => error instanceof EmailDeliveryPolicyError && error.code === "email_environment_unknown"
  );
});

test("Preview email is disabled when explicit test configuration is incomplete", () => {
  assert.throws(
    () => resolveEmailDeliveryPlan("owner@example.com", { ...previewBase, RESEND_API_KEY: "" }),
    (error) => error instanceof EmailDeliveryPolicyError && error.code === "preview_email_disabled"
  );
});

test("Preview email rejects a verified production sender", () => {
  assert.throws(
    () => resolveEmailDeliveryPlan("owner@example.com", { ...previewBase, RESEND_FROM: "TYORA <login@tyora.io>" }),
    (error) => error instanceof EmailDeliveryPolicyError && error.code === "preview_sender_not_safe"
  );
});

test("Preview email requires the exact safe test sender identity", () => {
  assert.throws(
    () =>
      resolveEmailDeliveryPlan("owner@example.com", {
        ...previewBase,
        RESEND_FROM: "Another Brand <onboarding@resend.dev>"
      }),
    (error) => error instanceof EmailDeliveryPolicyError && error.code === "preview_sender_not_safe"
  );
});

test("Preview email rejects recipients outside the explicit allowlist", () => {
  assert.throws(
    () => resolveEmailDeliveryPlan("customer@example.com", previewBase),
    (error) => error instanceof EmailDeliveryPolicyError && error.code === "preview_recipient_not_allowed"
  );
});

test("Preview email allows only an allowlisted recipient through the test sender", () => {
  assert.deepEqual(resolveEmailDeliveryPlan(" OWNER@example.com ", previewBase), {
    deployment: "preview",
    sender: "TYORA Preview <onboarding@resend.dev>",
    recipient: "owner@example.com"
  });
});

test("Preview email allows an allowlisted recipient through the exact verified Preview sender", () => {
  assert.deepEqual(
    resolveEmailDeliveryPlan("outlook-user@example.com", {
      ...previewBase,
      RESEND_FROM: "TYORA Preview <preview-login@tyora.io>",
      RESEND_USE_TEST_SENDER: "false",
      RESEND_PREVIEW_RECIPIENTS: "outlook-user@example.com"
    }),
    {
      deployment: "preview",
      sender: "TYORA Preview <preview-login@tyora.io>",
      recipient: "outlook-user@example.com"
    }
  );
});

test("Preview verified-sender mode rejects any other sender identity", () => {
  assert.throws(
    () =>
      resolveEmailDeliveryPlan("owner@example.com", {
        ...previewBase,
        RESEND_FROM: "TYORA <login@tyora.io>",
        RESEND_USE_TEST_SENDER: "false"
      }),
    (error) => error instanceof EmailDeliveryPolicyError && error.code === "preview_sender_not_safe"
  );
});

test("Preview requires an explicit sender mode", () => {
  assert.throws(
    () => resolveEmailDeliveryPlan("owner@example.com", { ...previewBase, RESEND_USE_TEST_SENDER: "" }),
    (error) => error instanceof EmailDeliveryPolicyError && error.code === "preview_email_disabled"
  );
});

test("Production keeps its configured verified sender", () => {
  assert.deepEqual(
    resolveEmailDeliveryPlan("customer@example.com", {
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      RESEND_API_KEY: "production-key-present",
      RESEND_FROM: "TYORA <login@tyora.io>"
    }),
    {
      deployment: "production",
      sender: "TYORA <login@tyora.io>",
      recipient: "customer@example.com"
    }
  );
});

test("Production preserves the verified TYORA sender when a test sender is configured", () => {
  assert.deepEqual(
    resolveEmailDeliveryPlan("customer@example.com", {
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      RESEND_API_KEY: "production-key-present",
      RESEND_FROM: "onboarding@resend.dev",
      RESEND_USE_TEST_SENDER: "true"
    }),
    {
      deployment: "production",
      sender: "TYORA <login@tyora.io>",
      recipient: "customer@example.com"
    }
  );
});

test("email request logging source excludes sensitive raw fields", async () => {
  const { readFile } = await import("node:fs/promises");
  const route = await readFile(new URL("../app/api/community/auth/email/request/route.ts", import.meta.url), "utf8");
  for (const forbidden of ["recipient:", "authOrigin:", "responseBody", "responseHeaders", "headers:"]) {
    assert.doesNotMatch(route, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(route, /JSON\.stringify\([^)]*body\.email/);
});

test("failed provider sends remove the unusable login-code row", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../lib/server/email-login.ts", import.meta.url), "utf8");
  assert.match(source, /const loginCodeId = makeCommunityId\("LOGIN"\)/);
  assert.match(source, /deleteMany\(\{ where: \{ id: loginCodeId \} \}\)/);
  assert.match(source, /catch \(error\)[\s\S]*deleteMany[\s\S]*throw error/);
});

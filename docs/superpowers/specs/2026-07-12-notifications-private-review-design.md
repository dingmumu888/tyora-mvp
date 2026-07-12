# Notifications And Private Review Design

## Goal

Make message read state behave predictably and give public ideas and confidential custom projects two distinct customer paths.

## Message Read State

- Opening the Messages panel marks all currently visible notifications as read.
- The Messages button and mobile/desktop avatar badges clear immediately after the read request succeeds.
- The client broadcasts the existing `tyora:community-notifications-read` event so every navigation surface updates without a reload.
- If the request fails, unread indicators remain visible and the customer can retry by reopening Messages.

## Public Idea Path

- `/ask/new` is only for public community ideas.
- Remove the Public/Private selector and all private-project explanatory copy from the form.
- Every submission uses `visibility: "Public"` and continues to the public discussion after creation.

## Private Custom Path

- Do not create a second private form.
- The primary Custom CTA becomes `Start Private Review on WhatsApp`.
- It opens WhatsApp with a prefilled English message explaining that the customer wants a private custom review and will send designs and requirements there.
- Keep `Post a public idea` as the separate community route.
- Keep a lower-emphasis email fallback for customers who prefer email.
- Source-page private-custom links use the same WhatsApp destination.

## Validation

- Source-based regression tests cover notification clearing, public-only posting, and WhatsApp CTA routing.
- Run all existing test scripts, TypeScript checking, production build, and responsive desktop/mobile browser checks before deployment.

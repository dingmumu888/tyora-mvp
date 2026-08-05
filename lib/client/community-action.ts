export function communityActionHeaders(action: string, idempotencyKey?: string) {
  return {
    "content-type": "application/json",
    "idempotency-key": idempotencyKey || `${action}:${crypto.randomUUID()}`
  };
}

export function communityActionHeaders(action: string) {
  return {
    "content-type": "application/json",
    "idempotency-key": `${action}:${crypto.randomUUID()}`
  };
}

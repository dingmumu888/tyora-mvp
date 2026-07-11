import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { getDetectedCountry } from "@/lib/server/request-country";
import { createSourceRequest, getSourceRequests } from "@/lib/server/source-store";

const emptyDestinationLabels = ["", "Not specified", "unknown", "n/a", "na"];
const emptyDestinationValues = new Set(emptyDestinationLabels.map((label) => label.toLowerCase()));

function hasCustomerDestination(value: unknown) {
  if (typeof value !== "string") return false;
  return !emptyDestinationValues.has(value.trim().toLowerCase());
}

function withDetectedCountry(input: unknown, detectedCountry: string) {
  if (!detectedCountry || !input || typeof input !== "object" || Array.isArray(input)) {
    return input;
  }

  const sourceInput = input as Record<string, unknown>;
  const description = typeof sourceInput.description === "string" ? sourceInput.description.trim() : "";
  const detectedCountryLine = `Detected country: ${detectedCountry}`;

  return {
    ...sourceInput,
    destinationCountry: hasCustomerDestination(sourceInput.destinationCountry)
      ? sourceInput.destinationCountry
      : detectedCountry,
    description: description.includes(detectedCountryLine)
      ? description
      : [description, detectedCountryLine].filter(Boolean).join("\n")
  };
}

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await getSourceRequests());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load source requests."));
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    return ok(await createSourceRequest(withDetectedCountry(input, getDetectedCountry(request.headers))));
  } catch (error) {
    return fail(messageFromError(error, "Unable to submit source request."), 400);
  }
}

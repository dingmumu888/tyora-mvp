import { ok } from "@/lib/server/api-response";
import { getDetectedCountry } from "@/lib/server/request-country";

export async function GET(request: Request) {
  return ok({ countryCode: getDetectedCountry(request.headers) || "US" });
}

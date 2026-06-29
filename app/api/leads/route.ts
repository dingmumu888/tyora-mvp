import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { createLead, getLeads, putLeads } from "@/lib/server/data-store";

const fieldLimits: Record<string, number> = {
  customerName: 120,
  company: 160,
  email: 254,
  country: 120,
  category: 120,
  productIdea: 3000,
  designType: 120,
  quantity: 80,
  budget: 80,
  timeline: 120,
  sampleRequirement: 500,
  sampleReview: 500,
  additionalRequirements: 3000
};

function textField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function validatePublicLead(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Invalid project submission.";
  }

  const data = body as Record<string, unknown>;
  const name = textField(data, "customerName");
  const email = textField(data, "email");
  const productIdea = textField(data, "productIdea");

  if (!name) return "Name is required.";
  if (!email) return "Email is required.";
  if (!productIdea) return "Product idea is required.";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address.";
  }

  for (const [key, maxLength] of Object.entries(fieldLimits)) {
    const value = data[key];
    if (typeof value === "string" && value.trim().length > maxLength) {
      return `${key} must be ${maxLength} characters or fewer.`;
    }
  }

  return null;
}

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await getLeads());
  } catch (error) {
    return fail(messageFromError(error, "Unable to load project submissions."));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationError = validatePublicLead(body);
    if (validationError) {
      return fail(validationError, 400);
    }

    return ok(await createLead(body));
  } catch (error) {
    return fail(messageFromError(error, "Unable to save project submission."));
  }
}

export async function PUT(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    return ok(await putLeads(await request.json()));
  } catch (error) {
    return fail(messageFromError(error, "Unable to save project submissions."));
  }
}

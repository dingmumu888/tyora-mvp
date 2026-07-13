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

export function validatePublicLeadSubmission(
  body: unknown,
  isAllowedPrivateFileReference: (value: string) => boolean
) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Invalid project submission.";
  }

  const data = body as Record<string, unknown>;
  const email = textField(data, "email");
  const productIdea = textField(data, "productIdea");

  if (!productIdea) return "Product idea is required.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address.";
  }

  for (const [key, maxLength] of Object.entries(fieldLimits)) {
    const value = data[key];
    if (typeof value === "string" && value.trim().length > maxLength) {
      return `${key} must be ${maxLength} characters or fewer.`;
    }
  }

  const uploadedFile = data.uploadedFile;
  if (
    uploadedFile !== undefined &&
    (typeof uploadedFile !== "string" ||
      (uploadedFile.trim() && !isAllowedPrivateFileReference(uploadedFile.trim())))
  ) {
    return "Invalid private project file reference.";
  }

  const uploadedFiles = data.uploadedFiles;
  if (
    uploadedFiles !== undefined &&
    (!Array.isArray(uploadedFiles) ||
      uploadedFiles.length > 10 ||
      uploadedFiles.some(
        (value) => typeof value !== "string" || !isAllowedPrivateFileReference(value.trim())
      ))
  ) {
    return "Invalid private project file references.";
  }

  return null;
}

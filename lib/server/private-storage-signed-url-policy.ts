export class PrivateSignedUrlPolicyError extends Error {
  constructor() {
    super("Private storage sign failed.");
    this.name = "PrivateSignedUrlPolicyError";
  }
}

export function normalizePrivateSignedUrl(
  value: string,
  supabaseOrigin: string,
  signedPath: string
) {
  if (!signedPath.startsWith("/storage/v1/object/sign/")) {
    throw new PrivateSignedUrlPolicyError();
  }

  const normalizedValue = value.startsWith("/object/sign/")
    ? `/storage/v1${value}`
    : value;
  let signedUrl: URL;
  try {
    signedUrl = new URL(normalizedValue, supabaseOrigin);
  } catch {
    throw new PrivateSignedUrlPolicyError();
  }

  const queryKeys = [...signedUrl.searchParams.keys()];
  const tokens = signedUrl.searchParams.getAll("token");
  if (
    signedUrl.origin !== supabaseOrigin ||
    signedUrl.pathname !== signedPath ||
    signedUrl.username ||
    signedUrl.password ||
    signedUrl.hash ||
    queryKeys.length !== 1 ||
    queryKeys[0] !== "token" ||
    tokens.length !== 1 ||
    !tokens[0]
  ) {
    throw new PrivateSignedUrlPolicyError();
  }

  return signedUrl.toString();
}

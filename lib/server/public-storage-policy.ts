export function isAllowedPublicObjectPath(objectPath: string) {
  if (objectPath.length > 512 || objectPath.includes("..")) return false;
  const segments = objectPath.split("/");
  if (segments.length !== 4 || !["image", "video"].includes(segments[0])) return false;
  if (!/^\d{4}$/.test(segments[1]) || !/^(0[1-9]|1[0-2])$/.test(segments[2])) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]+$/.test(segments[3]);
}

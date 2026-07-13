import { readFileSync } from "node:fs";

const source = readFileSync("app/source/source-client.tsx", "utf8");
const failures = [];

const requirements = [
  ["source images are resized before being added", source.includes("normalizeSourceImage") && source.includes("canvas.toDataURL")],
  ["each source image has an encoded size target", source.includes("SOURCE_IMAGE_MAX_DATA_URL_LENGTH")],
  ["the complete JSON request is size checked", source.includes("MAX_SOURCE_REQUEST_BYTES") && source.includes("new Blob([requestBody]).size")],
  ["API responses are read safely as text", source.includes("response.text()") && source.includes("parseApiResponse")],
  ["413 responses show an image-size message", source.includes("response.status === 413") && source.includes("Please remove some images")],
  ["raw source images are not sent directly", !source.includes("files.slice(0, remainingSlots).map(fileToDataUrl)")],
  ["the submit request reuses the checked body", source.includes("body: requestBody")]
];

for (const [name, pass] of requirements) {
  if (!pass) failures.push(name);
}

if (failures.length) {
  console.error("Source submission payload checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Source submission payload checks passed.");

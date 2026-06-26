import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const blocked = [
  ["MVP", "password"].join(" "),
  ["tyora", "2026"].join("")
];
const ignoredDirectories = new Set([".git", "node_modules"]);
const ignoredFiles = new Set([".env"]);
const scannedExtensions = new Set([
  ".html",
  ".js",
  ".json",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt",
  ".map"
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const matches = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.relative(root, fullPath);

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) continue;
      matches.push(...(await walk(fullPath)));
      continue;
    }

    if (ignoredFiles.has(entry.name)) continue;
    const extension = path.extname(entry.name);
    if (!scannedExtensions.has(extension)) continue;

    const fileStat = await stat(fullPath);
    if (fileStat.size > 5 * 1024 * 1024) continue;

    const content = await readFile(fullPath, "utf8");
    for (const phrase of blocked) {
      if (content.includes(phrase)) {
        matches.push(`${relativePath}: contains blocked admin secret text`);
      }
    }
  }

  return matches;
}

const matches = await walk(root);

if (matches.length > 0) {
  console.error(matches.join("\n"));
  process.exit(1);
}

console.log("Security scan passed.");

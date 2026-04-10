import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scanRoots = [path.join(projectRoot, "src")];
const extensions = new Set([".ts", ".html", ".scss", ".css", ".js", ".json"]);
const decoder = new TextDecoder("utf-8", { fatal: true });
let hasError = false;

function walk(dir) {
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const filePath = path.join(dir, entry);
    let stats;
    try {
      stats = statSync(filePath);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      walk(filePath);
      continue;
    }

    if (!extensions.has(path.extname(filePath))) continue;

    const buffer = readFileSync(filePath);
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      console.log(`Verification failed: BOM found in ${filePath}`);
      hasError = true;
    }

    let text = "";
    try {
      text = decoder.decode(buffer);
    } catch {
      console.log(`Verification failed: invalid UTF-8 in ${filePath}`);
      hasError = true;
      continue;
    }

    if (/Ã[A-Za-z0-9]/u.test(text) || /Â[A-Za-z0-9]/u.test(text) || text.includes("�")) {
      console.log(`Verification failed: mojibake signature found in ${filePath}`);
      hasError = true;
    }
  }
}

for (const root of scanRoots) walk(root);

if (hasError) {
  console.log("Verification failed: one or more errors (see above)");
  process.exit(1);
}

console.log("Verification OK: none");

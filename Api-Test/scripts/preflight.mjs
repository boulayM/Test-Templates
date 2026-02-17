import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const target = process.argv[2];
const allowed = new Set(["dev", "test", "e2e"]);
if (!allowed.has(target)) {
  console.error("[preflight] Usage: node scripts/preflight.mjs <dev|test|e2e>");
  process.exit(1);
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let envFile = ".env";
if (target === "dev") {
  envFile = existsSync(path.join(projectRoot, ".env.dev")) ? ".env.dev" : ".env";
}
if (target === "test") envFile = ".env.test";
if (target === "e2e") envFile = ".env.e2e";

const envPath = path.join(projectRoot, envFile);
if (!existsSync(envPath)) {
  console.error(`[preflight] Missing env file: ${envPath}`);
  process.exit(1);
}

const content = readFileSync(envPath, "utf8");
const match = content.match(/^DATABASE_URL\s*=\s*(.+)$/m);
if (!match) {
  console.error(`[preflight] DATABASE_URL not found in ${envFile}`);
  process.exit(1);
}

const dbUrl = match[1].trim().replace(/^"|"$/g, "");
const dbUrlLower = dbUrl.toLowerCase();

console.log(`[preflight] target=${target} env=${envFile}`);
console.log(`[preflight] DATABASE_URL=${dbUrl}`);

const looksLikeDev =
  dbUrlLower.includes("mirror-api") ||
  dbUrlLower.includes("dev-api") ||
  dbUrlLower.includes("localhost:5432/postgres");

const looksLikeTest =
  dbUrlLower.includes("test") ||
  dbUrlLower.includes("_test") ||
  dbUrlLower.includes("test-api");

if ((target === "test" || target === "e2e") && looksLikeDev && !looksLikeTest) {
  console.error(`[preflight] Refusing: ${target} target points to dev-like DB`);
  process.exit(1);
}

if (target === "dev") {
  console.log("[preflight] Warning: dev target selected. Destructive commands must be intentional.");
}

console.log("[preflight] OK");

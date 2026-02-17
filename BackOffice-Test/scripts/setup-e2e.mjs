import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(projectRoot, ".env.e2e");

if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const apiUrl = process.env.E2E_API_URL || "http://localhost:3001/api";
const apiPath = process.env.E2E_API_PATH || "F:/Marc/Marc/DevWeb/Templates/TESTS/Test-Templates/Api-Test";

console.log(`Using API URL: ${apiUrl}`);
console.log(`Using API path: ${apiPath}`);

if (!existsSync(apiPath)) {
  console.log("Error: API path not found");
  process.exit(1);
}

function tcpCheck(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const onDone = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => onDone(true));
    socket.once("timeout", () => onDone(false));
    socket.once("error", () => onDone(false));
  });
}

async function main() {
  const parsed = new URL(apiUrl);
  const maxAttempts = 6;
  let reachable = false;

  for (let i = 0; i < maxAttempts; i += 1) {
    reachable = await tcpCheck(parsed.hostname, Number(parsed.port));
    if (reachable) break;
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (!reachable) {
    console.log(`Error: API not reachable at ${parsed.hostname}:${parsed.port}`);
    process.exit(1);
  }

  console.log(`API reachable (TCP ${parsed.hostname}:${parsed.port})`);

  try {
    const probe = await fetch(`${apiUrl}/csrf`);
    console.log(`API probe /csrf: ${probe.status}`);
  } catch {
    console.log("API probe /csrf: no HTTP response");
  }

  console.log("Running prisma db seed with .env.e2e...");
  const isWindows = process.platform === "win32";
  const command = isWindows ? "cmd.exe" : "npx";
  const args = isWindows
    ? ["/d", "/s", "/c", "npx dotenv -e .env.e2e -- prisma db seed"]
    : ["dotenv", "-e", ".env.e2e", "--", "prisma", "db", "seed"];

  const result = spawnSync(command, args, {
    cwd: apiPath,
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    console.log("Error: seed failed");
    process.exit(result.status || 1);
  }
}

main();

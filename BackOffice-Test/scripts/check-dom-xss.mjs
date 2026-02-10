import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src', 'app');
const exts = new Set(['.ts', '.html']);

const checks = [
  { name: 'innerHTML usage', regex: /\[innerHTML\]|\.innerHTML\b/i },
  { name: 'DOM sanitizer bypass', regex: /\bDomSanitizer\b|\bbypassSecurityTrust(?:Html|Style|Script|Url|ResourceUrl)\b/ },
  { name: 'HTML injection sinks', regex: /\bouterHTML\b|\binsertAdjacentHTML\b|\bdocument\.write\s*\(/i },
  { name: 'Dynamic code execution', regex: /\beval\s*\(|\bnew Function\s*\(/i },
  { name: 'javascript: URL', regex: /javascript:/i },
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (exts.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const findings = [];
  lines.forEach((line, idx) => {
    checks.forEach((check) => {
      if (check.regex.test(line)) {
        findings.push({
          file: filePath,
          line: idx + 1,
          rule: check.name,
          text: line.trim(),
        });
      }
    });
  });
  return findings;
}

if (!fs.existsSync(root)) {
  console.error(`Path not found: ${root}`);
  process.exit(1);
}

const files = walk(root);
const findings = files.flatMap(scanFile);

if (findings.length > 0) {
  console.error('DOM XSS guard failed. Forbidden patterns detected:\n');
  findings.forEach((f) => {
    console.error(`- ${f.file}:${f.line} [${f.rule}] ${f.text}`);
  });
  process.exit(1);
}

console.log('DOM XSS guard passed.');

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const routesPath = path.join(root, 'src', 'app', 'app.routes.ts');
const indexPath = path.join(root, 'src', 'index.html');

const routes = fs.readFileSync(routesPath, 'utf8');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

const failures = [];

if (/TODO: edit for prod/i.test(indexHtml)) {
  failures.push('index.html still contains SEO TODO placeholder.');
}

for (const token of ['name="description"', 'name="robots"', 'property="og:image"', 'name="twitter:card"']) {
  if (!indexHtml.includes(token)) {
    failures.push(`index.html missing token: ${token}`);
  }
}

const seoBlocks = (routes.match(/seo:\s*\{/g) || []).length;
if (seoBlocks < 8) failures.push(`Not enough route-level seo blocks found (${seoBlocks}).`);

if (!/path:\s*'home'[\s\S]*?indexable:\s*true/.test(routes)) {
  failures.push('/home must be indexable.');
}

if (!/path:\s*'catalog'[\s\S]*?indexable:\s*true/.test(routes)) {
  failures.push('/catalog must be indexable.');
}

if (!/path:\s*'login'[\s\S]*?indexable:\s*false/.test(routes)) {
  failures.push('/login must be noindex.');
}

if (!/path:\s*'account'[\s\S]*?indexable:\s*false/.test(routes)) {
  failures.push('Account routes must remain noindex.');
}

if (failures.length) {
  console.error('SEO static checks failed:');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('SEO static checks passed.');

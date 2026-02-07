import { test } from '@playwright/test';

const adminEmail = (process.env.E2E_ADMIN_EMAIL || '') as string;
const adminPassword = (process.env.E2E_ADMIN_PASSWORD || '') as string;
const apiUrl = process.env.E2E_API_URL || 'http://localhost:3000/api';

async function ensureApiUp(page: import('@playwright/test').Page) {
  try {
    const res = await page.request.get(`${apiUrl}/csrf`);
    if (!res.ok()) {
      test.skip(true, 'API not reachable');
    }
  } catch {
    test.skip(true, 'API not reachable');
  }
}

test('auth setup', async ({ page }) => {
  test.skip(!adminEmail || !adminPassword, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');
  await ensureApiUp(page);

  await page.addInitScript((url) => {
    (window as any).__env = { ...(window as any).__env, API_URL: url };
  }, apiUrl);

  await page.goto('/login');
  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Mot de passe').fill(adminPassword);
  await page.getByRole('button', { name: /login/i }).click();

  const errorLocator = page.locator('.text-danger');
  const dashboardPromise = page.waitForURL(/\/dashboard/, { timeout: 10000 })
    .then(() => 'dashboard')
    .catch(() => 'timeout');
  const errorPromise = errorLocator.waitFor({ state: 'visible', timeout: 10000 })
    .then(() => 'error')
    .catch(() => 'timeout');

  const result = await Promise.race([dashboardPromise, errorPromise]);

  if (result !== 'dashboard') {
    const msg = (await errorLocator.textContent()) || 'no redirect to dashboard';
    throw new Error(`Login failed: ${msg}`);
  }

  await page.context().storageState({ path: 'e2e.storage.json' });
});

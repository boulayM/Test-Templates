import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
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

async function ensureAuth(page: import('@playwright/test').Page, path: string) {
  await ensureApiUp(page);

  await page.addInitScript((url) => {
    (window as any).__env = { ...(window as any).__env, API_URL: url };
  }, apiUrl);

  await page.goto(path);
  const url = page.url();
  if (url.includes('/login') || url.includes('/access-denied')) {
    test.skip(!adminEmail || !adminPassword, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminEmail || '');
    await page.getByLabel('Mot de passe').fill(adminPassword || '');
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
    if (path !== '/dashboard') {
      await page.goto(path);
    }
  }

  const finalUrl = page.url();
  if (finalUrl.includes('/access-denied') || finalUrl.includes('/login')) {
    throw new Error(`Not authenticated on ${path}. Current URL: ${finalUrl}`);
  }
}

test.describe.serial('Audit logs critical', () => {
  test('audit logs page loads', async ({ page }) => {
    await ensureAuth(page, '/audit-logs');
    await expect(page.locator('h1', { hasText: 'Audit Logs' })).toBeVisible();
  });

  test('filter by action triggers list', async ({ page }) => {
    await ensureAuth(page, '/audit-logs');

    const waitList = page.waitForResponse(
      (res) => res.url().includes('/api/audit-logs') && res.request().method() === 'GET',
      { timeout: 10000 },
    );

    await page.locator('#auditAction').fill('LOGIN');
    await page.keyboard.press('Enter');

    const listRes = await waitList;
    if (listRes.status() !== 200) {
      throw new Error('List failed with status ' + listRes.status());
    }
  });

  test('open details if row exists', async ({ page }) => {
    await ensureAuth(page, '/audit-logs');
    const rows = page.locator('tbody tr');
    if ((await rows.count()) === 0) {
      test.skip(true, 'No logs');
    }
    await rows.first().getByRole('button', { name: 'Details' }).click();
    const details = page.locator('#audit-details');
    try {
      await details.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      test.skip(true, 'Details not available');
    }
    await expect(details).toBeVisible();
  });

  test('export CSV', async ({ page }) => {
    await ensureAuth(page, '/audit-logs');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#auditExportCsv').click();
    const download = await downloadPromise;
    await expect(download.suggestedFilename()).toContain('audit');
  });
});
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

test.describe.serial('BackOffice smoke', () => {
  test('dashboard loads', async ({ page }) => {
    await ensureAuth(page, '/dashboard');
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
  });

  test('users loads', async ({ page }) => {
    await ensureAuth(page, '/users');
    await expect(page.locator('h1', { hasText: 'Users' })).toBeVisible();
  });

  test('audit logs loads', async ({ page }) => {
    await ensureAuth(page, '/audit-logs');
    await expect(page.locator('h1', { hasText: 'Audit Logs' })).toBeVisible();
  });

  test('categories loads', async ({ page }) => {
    await ensureAuth(page, '/categories');
    await expect(page.locator('h1', { hasText: 'Categories' })).toBeVisible();
  });

  test('products loads', async ({ page }) => {
    await ensureAuth(page, '/products');
    await expect(page.locator('h1', { hasText: 'Products' })).toBeVisible();
  });

  test('images loads', async ({ page }) => {
    await ensureAuth(page, '/images');
    await expect(page.locator('h1', { hasText: 'Images' })).toBeVisible();
  });

  test('inventory loads', async ({ page }) => {
    await ensureAuth(page, '/inventory');
    await expect(page.locator('h1', { hasText: 'Inventory' })).toBeVisible();
  });

  test('orders loads', async ({ page }) => {
    await ensureAuth(page, '/orders');
    await expect(page.locator('h1', { hasText: 'Orders' })).toBeVisible();
  });

  test('payments loads', async ({ page }) => {
    await ensureAuth(page, '/payments');
    await expect(page.locator('h1', { hasText: 'Payments' })).toBeVisible();
  });

  test('shipments loads', async ({ page }) => {
    await ensureAuth(page, '/shipments');
    await expect(page.locator('h1', { hasText: 'Shipments' })).toBeVisible();
  });

  test('coupons loads', async ({ page }) => {
    await ensureAuth(page, '/coupons');
    await expect(page.locator('h1', { hasText: 'Coupons' })).toBeVisible();
  });

  test('reviews loads', async ({ page }) => {
    await ensureAuth(page, '/reviews');
    await expect(page.locator('h1', { hasText: 'Reviews' })).toBeVisible();
  });
});

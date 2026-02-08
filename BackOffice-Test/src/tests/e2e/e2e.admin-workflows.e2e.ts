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
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    if (path !== '/dashboard') await page.goto(path);
  }

  const finalUrl = page.url();
  if (finalUrl.includes('/access-denied') || finalUrl.includes('/login')) {
    throw new Error(`Not authenticated on ${path}. Current URL: ${finalUrl}`);
  }
}

test.describe.serial('Admin workflows', () => {
  test('update order status', async ({ page }) => {
    const waitList = page.waitForResponse(
      (res) => res.url().includes('/api/admin/orders') && res.request().method() === 'GET',
      { timeout: 15000 },
    );
    await ensureAuth(page, '/orders');
    const listRes = await waitList;

    const updates = page.locator('[data-testid^="order-update-"]');
    await updates.first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => undefined);
    const count = await updates.count();
    test.skip(count === 0, `No order row visible (list status ${listRes.status()})`);

    const firstUpdate = updates.first();
    await expect(firstUpdate).toBeVisible();

    const firstSelect = page.locator('[data-testid^="order-status-"]').first();
    await firstSelect.selectOption('PREPARING');

    const waitPatch = page.waitForResponse(
      (res) => res.url().includes('/api/admin/orders/') && res.url().includes('/status') && res.request().method() === 'PATCH',
      { timeout: 15000 },
    );

    await firstUpdate.click();
    const patch = await waitPatch;
    expect([200, 204]).toContain(patch.status());
  });

  test('update payment status', async ({ page }) => {
    const waitList = page.waitForResponse(
      (res) => res.url().includes('/api/admin/payments') && res.request().method() === 'GET',
      { timeout: 15000 },
    );
    await ensureAuth(page, '/payments');
    await waitList;

    const updates = page.locator('[data-testid^="payment-update-"]');
    await updates.first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => undefined);
    const count = await updates.count();
    test.skip(count === 0, 'No payment row visible');

    const firstUpdate = updates.first();
    await expect(firstUpdate).toBeVisible();

    const firstSelect = page.locator('[data-testid^="payment-status-"]').first();
    await firstSelect.selectOption('CAPTURED');

    const waitPatch = page.waitForResponse(
      (res) => res.url().includes('/api/admin/payments/') && res.url().includes('/status') && res.request().method() === 'PATCH',
      { timeout: 15000 },
    );

    await firstUpdate.click();
    const patch = await waitPatch;
    expect([200, 204]).toContain(patch.status());
  });

  test('update shipment status', async ({ page }) => {
    const waitList = page.waitForResponse(
      (res) => res.url().includes('/api/admin/shipments') && res.request().method() === 'GET',
      { timeout: 15000 },
    );
    await ensureAuth(page, '/shipments');
    await waitList;

    const updates = page.locator('[data-testid^="shipment-update-"]');
    await updates.first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => undefined);
    const count = await updates.count();
    test.skip(count === 0, 'No shipment row visible');

    const firstUpdate = updates.first();
    await expect(firstUpdate).toBeVisible();

    const firstSelect = page.locator('[data-testid^="shipment-status-"]').first();
    await firstSelect.selectOption('IN_TRANSIT');

    const waitPatch = page.waitForResponse(
      (res) => res.url().includes('/api/admin/shipments/') && res.request().method() === 'PATCH',
      { timeout: 15000 },
    );

    await firstUpdate.click();
    const patch = await waitPatch;
    expect([200, 204]).toContain(patch.status());
  });

  test('create coupon', async ({ page }) => {
    await ensureAuth(page, '/coupons');

    const code = `E2E${Date.now()}`;
    await page.locator('[data-testid="coupon-code"]').fill(code);
    await page.locator('[data-testid="coupon-type"]').selectOption('PERCENT');
    await page.locator('[data-testid="coupon-value"]').fill('10');

    const waitPost = page.waitForResponse(
      (res) => res.url().includes('/api/admin/coupons') && res.request().method() === 'POST',
      { timeout: 15000 },
    );

    await page.locator('[data-testid="coupon-create"]').click();
    const post = await waitPost;
    expect([200, 201]).toContain(post.status());
  });

  test('update inventory quantity', async ({ page }) => {
    const waitList = page.waitForResponse(
      (res) => res.url().includes('/api/admin/inventory') && res.request().method() === 'GET',
      { timeout: 15000 },
    );
    await ensureAuth(page, '/inventory');
    await waitList;

    const updates = page.locator('[data-testid^="inventory-update-"]');
    await updates.first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => undefined);
    const count = await updates.count();
    test.skip(count === 0, 'No inventory row visible');

    const firstInput = page.locator('[data-testid^="inventory-quantity-"]').first();
    const firstUpdate = updates.first();
    await expect(firstUpdate).toBeVisible();

    const current = await firstInput.inputValue();
    const next = String(Math.max(0, Number(current || '0') + 1));
    await firstInput.fill(next);

    const waitPatch = page.waitForResponse(
      (res) => res.url().includes('/api/admin/inventory/') && res.request().method() === 'PATCH',
      { timeout: 15000 },
    );

    await firstUpdate.click();
    const patch = await waitPatch;
    expect([200, 204]).toContain(patch.status());
  });
});

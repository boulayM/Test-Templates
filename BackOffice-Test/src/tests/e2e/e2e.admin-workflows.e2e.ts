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
    await page.waitForURL(/\/dashboard/);

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

function nextOrderStatus(current: string): string | null {
  const transitions: Record<string, string[]> = {
    PENDING: ['PAID', 'CANCELLED'],
    PAID: ['PREPARING', 'CANCELLED', 'REFUNDED'],
    PREPARING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'REFUNDED'],
    DELIVERED: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: [],
  };
  const candidates = transitions[current] || [];
  return candidates.length > 0 ? candidates[0] : null;
}

test.describe.serial('Admin workflows', () => {
  test('update order status', async ({ page }) => {
    await ensureAuth(page, '/orders');
    await expect(page.locator('h1', { hasText: 'Orders' })).toBeVisible();

    const firstRow = page.locator('tbody tr').first();
    if ((await firstRow.count()) === 0) {
      test.skip(true, 'No order row found');
    }

    const orderId = Number((await firstRow.locator('td').nth(0).textContent()) || '0');
    const currentStatus = await firstRow.locator('select').inputValue();
    const targetStatus = nextOrderStatus(currentStatus);
    if (!orderId || !targetStatus) {
      test.skip(true, `No valid transition from ${currentStatus}`);
    }

    const waitUpdate = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/admin/orders/${orderId}/status`) &&
        res.request().method() === 'PATCH',
      { timeout: 15000 },
    );

    await firstRow.locator('select').selectOption(targetStatus as string);
    await firstRow.getByRole('button', { name: 'Update' }).click();

    const updateRes = await waitUpdate;
    expect(updateRes.status()).toBe(200);
  });

  test('update payment status', async ({ page }) => {
    await ensureAuth(page, '/payments');
    await expect(page.locator('h1', { hasText: 'Payments' })).toBeVisible();

    const firstRow = page.locator('tbody tr').first();
    if ((await firstRow.count()) === 0) {
      test.skip(true, 'No payment row found');
    }

    const paymentId = Number((await firstRow.locator('td').nth(0).textContent()) || '0');
    const currentStatus = await firstRow.locator('select').inputValue();
    const targetStatus = currentStatus === 'CAPTURED' ? 'AUTHORIZED' : 'CAPTURED';
    if (!paymentId) {
      test.skip(true, 'No payment id');
    }

    const waitUpdate = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/admin/payments/${paymentId}/status`) &&
        res.request().method() === 'PATCH',
      { timeout: 15000 },
    );

    await firstRow.locator('select').selectOption(targetStatus);
    await firstRow.getByRole('button', { name: 'Update' }).click();

    const updateRes = await waitUpdate;
    expect(updateRes.status()).toBe(200);
  });

  test('update shipment status', async ({ page }) => {
    await ensureAuth(page, '/shipments');
    await expect(page.locator('h1', { hasText: 'Shipments' })).toBeVisible();

    const firstRow = page.locator('tbody tr').first();
    if ((await firstRow.count()) === 0) {
      test.skip(true, 'No shipment row found');
    }

    const shipmentId = Number((await firstRow.locator('td').nth(0).textContent()) || '0');
    const currentStatus = await firstRow.locator('select').inputValue();
    const nextMap: Record<string, string> = {
      CREATED: 'IN_TRANSIT',
      IN_TRANSIT: 'DELIVERED',
      DELIVERED: 'LOST',
      LOST: 'CREATED',
    };
    const targetStatus = nextMap[currentStatus] || 'IN_TRANSIT';
    if (!shipmentId) {
      test.skip(true, 'No shipment id');
    }

    const waitUpdate = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/admin/shipments/${shipmentId}`) &&
        res.request().method() === 'PATCH',
      { timeout: 15000 },
    );

    await firstRow.locator('select').selectOption(targetStatus);
    await firstRow.getByRole('button', { name: 'Update' }).click();

    const updateRes = await waitUpdate;
    expect(updateRes.status()).toBe(200);
  });

  test('create coupon', async ({ page }) => {
    await ensureAuth(page, '/coupons');
    await expect(page.locator('h1', { hasText: 'Coupons' })).toBeVisible();

    const code = `E2E_${Date.now()}`;

    const waitCreate = page.waitForResponse(
      (res) => res.url().includes('/api/admin/coupons') && res.request().method() === 'POST',
      { timeout: 15000 },
    );

    const createRow = page.locator('.create-row').first();
    await createRow.locator('input').nth(0).fill(code);
    await createRow.locator('select').first().selectOption('PERCENT');
    await createRow.locator('input').nth(1).fill('10');
    await createRow.getByRole('button', { name: 'Create' }).click();

    const createRes = await waitCreate;
    expect([200, 201]).toContain(createRes.status());

    await expect(page.locator('tbody tr', { hasText: code })).toBeVisible({ timeout: 10000 });
  });

  test('update inventory quantity', async ({ page }) => {
    await ensureAuth(page, '/inventory');
    await expect(page.locator('h1', { hasText: 'Inventory' })).toBeVisible();

    const firstRow = page.locator('tbody tr').first();
    if ((await firstRow.count()) === 0) {
      test.skip(true, 'No inventory row found');
    }

    const inventoryId = Number((await firstRow.locator('td').nth(0).textContent()) || '0');
    if (!inventoryId) {
      test.skip(true, 'No inventory id');
    }

    const qtyInput = firstRow.locator('input[type="number"]').nth(0);
    const currentQtyText = await qtyInput.inputValue();
    const currentQty = Number(currentQtyText || '0');
    const nextQty = Number.isNaN(currentQty) ? 1 : currentQty + 1;
    await qtyInput.fill(String(nextQty));

    const waitUpdate = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/admin/inventory/${inventoryId}`) &&
        res.request().method() === 'PATCH',
      { timeout: 15000 },
    );

    await firstRow.getByRole('button', { name: 'Update' }).click();

    const updateRes = await waitUpdate;
    expect(updateRes.status()).toBe(200);
  });
});


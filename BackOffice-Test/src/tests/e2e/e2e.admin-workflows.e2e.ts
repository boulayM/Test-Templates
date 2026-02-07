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

async function fetchList(page: import('@playwright/test').Page, endpoint: string): Promise<unknown[]> {
  const res = await page.request.get(`${apiUrl}${endpoint}`);
  if (!res.ok()) return [];
  const body = (await res.json()) as Record<string, unknown>;
  return Array.isArray(body.data) ? (body.data as unknown[]) : [];
}

async function getCsrfToken(page: import('@playwright/test').Page): Promise<string | null> {
  const csrfRes = await page.request.get(`${apiUrl}/csrf`);
  if (!csrfRes.ok()) return null;
  const payload = (await csrfRes.json()) as Record<string, unknown>;
  return typeof payload.csrfToken === 'string' ? payload.csrfToken : null;
}

async function createTransitionableOrder(page: import('@playwright/test').Page): Promise<number | null> {
  const csrfToken = await getCsrfToken(page);
  if (!csrfToken) return null;

  const loginRes = await page.request.post(`${apiUrl}/auth/login`, {
    data: { email: 'alice@test.local', password: 'User123!' },
    headers: { 'x-csrf-token': csrfToken },
  });
  if (!loginRes.ok()) return null;

  const csrfAfterLogin = (await getCsrfToken(page)) || csrfToken;

  const productsRes = await page.request.get(`${apiUrl}/public/products?limit=1&_ts=${Date.now()}`);
  if (!productsRes.ok()) return null;
  const productsBody = (await productsRes.json()) as Record<string, unknown>;
  const products = Array.isArray(productsBody.data) ? (productsBody.data as Record<string, unknown>[]) : [];
  const firstProductId = products.find((p) => typeof p.id === 'number')?.id as number | undefined;
  if (!firstProductId) return null;

  const addressesRes = await page.request.get(`${apiUrl}/public/addresses?limit=10&_ts=${Date.now()}`);
  if (!addressesRes.ok()) return null;
  const addressesBody = (await addressesRes.json()) as Record<string, unknown>;
  const addresses = Array.isArray(addressesBody.data) ? (addressesBody.data as Record<string, unknown>[]) : [];
  const firstAddressId = addresses.find((a) => typeof a.id === 'number')?.id as number | undefined;
  if (!firstAddressId) return null;

  const addCartRes = await page.request.post(`${apiUrl}/public/cart/items`, {
    data: { productId: firstProductId, quantity: 1 },
    headers: { 'x-csrf-token': csrfAfterLogin },
  });
  if (!addCartRes.ok()) return null;

  const orderRes = await page.request.post(`${apiUrl}/public/orders`, {
    data: {
      shippingAddressId: firstAddressId,
      billingAddressId: firstAddressId,
    },
    headers: { 'x-csrf-token': csrfAfterLogin },
  });
  if (![200, 201].includes(orderRes.status())) return null;

  const orderBody = (await orderRes.json()) as Record<string, unknown>;
  const order = (orderBody.order && typeof orderBody.order === 'object'
    ? (orderBody.order as Record<string, unknown>)
    : null);
  return order && typeof order.id === 'number' ? order.id : null;
}

test.describe.serial('Admin workflows', () => {
  test('update order status', async ({ page }) => {
    await ensureAuth(page, '/orders');
    await expect(page.locator('h1', { hasText: 'Orders' })).toBeVisible();

    let rows = await fetchList(page, '/admin/orders?limit=50&_ts=' + Date.now());
    let candidate = rows
      .map((r) => (r && typeof r === 'object' ? (r as Record<string, unknown>) : null))
      .find((r) => !!r && typeof r.id === 'number' && typeof r.status === 'string' && nextOrderStatus(r.status));

    if (!candidate) {
      const newOrderId = await createTransitionableOrder(page);
      if (newOrderId) {
        rows = await fetchList(page, '/admin/orders?limit=50&_ts=' + Date.now());
        candidate = rows
          .map((r) => (r && typeof r === 'object' ? (r as Record<string, unknown>) : null))
          .find((r) => !!r && r.id === newOrderId && typeof r.status === 'string' && nextOrderStatus(r.status));
      }
    }

    const orderId = candidate?.id as number;
    const currentStatus = candidate?.status as string;
    const targetStatus = nextOrderStatus(currentStatus);
    if (!orderId || !targetStatus) {
      test.skip(true, `No valid transition from ${currentStatus}`);
    }

    await page.locator('.actions input').fill(String(orderId));
    await page.getByRole('button', { name: 'Refresh' }).click();

    const targetRow = page.locator('tbody tr', { hasText: String(orderId) }).first();
    await expect(targetRow).toBeVisible({ timeout: 10000 });

    const waitUpdate = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/admin/orders/${orderId}/status`) &&
        res.request().method() === 'PATCH',
      { timeout: 15000 },
    );

    await targetRow.locator('select').selectOption(targetStatus as string);
    await targetRow.getByRole('button', { name: 'Update' }).click();

    const updateRes = await waitUpdate;
    expect(updateRes.status()).toBe(200);
  });

  test('update payment status', async ({ page }) => {
    await ensureAuth(page, '/payments');
    await expect(page.locator('h1', { hasText: 'Payments' })).toBeVisible();

    const rows = await fetchList(page, '/admin/payments?limit=50&_ts=' + Date.now());
    const candidate = rows
      .map((r) => (r && typeof r === 'object' ? (r as Record<string, unknown>) : null))
      .find((r) => !!r && typeof r.id === 'number' && typeof r.status === 'string');

    if (!candidate) {
      test.skip(true, 'No payment row found');
    }

    const paymentId = candidate?.id as number;
    const currentStatus = candidate?.status as string;
    const targetStatus = currentStatus === 'CAPTURED' ? 'AUTHORIZED' : 'CAPTURED';
    if (!paymentId) {
      test.skip(true, 'No payment id');
    }

    await page.locator('.actions input').fill(String(paymentId));
    await page.getByRole('button', { name: 'Refresh' }).click();

    const targetRow = page.locator('tbody tr', { hasText: String(paymentId) }).first();
    await expect(targetRow).toBeVisible({ timeout: 10000 });

    const waitUpdate = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/admin/payments/${paymentId}/status`) &&
        res.request().method() === 'PATCH',
      { timeout: 15000 },
    );

    await targetRow.locator('select').selectOption(targetStatus);
    await targetRow.getByRole('button', { name: 'Update' }).click();

    const updateRes = await waitUpdate;
    expect(updateRes.status()).toBe(200);
  });

  test('update shipment status', async ({ page }) => {
    await ensureAuth(page, '/shipments');
    await expect(page.locator('h1', { hasText: 'Shipments' })).toBeVisible();

    const rows = await fetchList(page, '/admin/shipments?limit=50&_ts=' + Date.now());
    const candidate = rows
      .map((r) => (r && typeof r === 'object' ? (r as Record<string, unknown>) : null))
      .find((r) => !!r && typeof r.id === 'number' && typeof r.status === 'string');

    if (!candidate) {
      test.skip(true, 'No shipment row found');
    }

    const shipmentId = candidate?.id as number;
    const currentStatus = candidate?.status as string;
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

    await page.locator('.actions input').fill(String(shipmentId));
    await page.getByRole('button', { name: 'Refresh' }).click();

    const targetRow = page.locator('tbody tr', { hasText: String(shipmentId) }).first();
    await expect(targetRow).toBeVisible({ timeout: 10000 });

    const waitUpdate = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/admin/shipments/${shipmentId}`) &&
        res.request().method() === 'PATCH',
      { timeout: 15000 },
    );

    await targetRow.locator('select').selectOption(targetStatus);
    await targetRow.getByRole('button', { name: 'Update' }).click();

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

    const rows = await fetchList(page, '/admin/inventory?limit=50&_ts=' + Date.now());
    const candidate = rows
      .map((r) => (r && typeof r === 'object' ? (r as Record<string, unknown>) : null))
      .find((r) => !!r && typeof r.id === 'number');

    if (!candidate) {
      test.skip(true, 'No inventory row found');
    }

    const inventoryId = candidate?.id as number;
    if (!inventoryId) {
      test.skip(true, 'No inventory id');
    }

    await page.locator('.actions input').fill(String(inventoryId));
    await page.getByRole('button', { name: 'Refresh' }).click();

    const targetRow = page.locator('tbody tr', { hasText: String(inventoryId) }).first();
    await expect(targetRow).toBeVisible({ timeout: 10000 });

    const qtyInput = targetRow.locator('input[type="number"]').nth(0);
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

    await targetRow.getByRole('button', { name: 'Update' }).click();

    const updateRes = await waitUpdate;
    expect(updateRes.status()).toBe(200);
  });
});

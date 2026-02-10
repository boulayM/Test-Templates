import { test, expect } from '@playwright/test';

const apiUrl = process.env.E2E_API_URL || 'http://localhost:3000/api';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin1@test.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'Admin123!';
const logiEmail = process.env.E2E_LOGI_EMAIL || 'logi1@test.local';
const logiPassword = process.env.E2E_LOGI_PASSWORD || 'User123!';
const comptaEmail = process.env.E2E_COMPTA_EMAIL || 'compta1@test.local';
const comptaPassword = process.env.E2E_COMPTA_PASSWORD || 'User123!';

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

async function loginAs(page: import('@playwright/test').Page, email: string, password: string, roleLabel: string) {
  test.skip(!email || !password, `Missing e2e credentials for ${roleLabel}`);
  await ensureApiUp(page);

  await page.addInitScript((url) => {
    (window as unknown as { __env?: { API_URL?: string } }).__env = {
      ...((window as unknown as { __env?: { API_URL?: string } }).__env || {}),
      API_URL: url,
    };
  }, apiUrl);

  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: /login/i }).click();

  const errorLocator = page.locator('.text-danger');
  const dashboardPromise = page
    .waitForURL(/\/dashboard/, { timeout: 10000 })
    .then(() => 'dashboard')
    .catch(() => 'timeout');
  const errorPromise = errorLocator
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => 'error')
    .catch(() => 'timeout');

  const result = await Promise.race([dashboardPromise, errorPromise]);
  if (result !== 'dashboard') {
    const msg = (await errorLocator.textContent()) || 'no redirect to dashboard';
    throw new Error(`Login failed for ${roleLabel}: ${msg}`);
  }
}

async function expectAllowed(page: import('@playwright/test').Page, path: string) {
  await page.goto(path);
  await expect(page).not.toHaveURL(/access-denied/);
}

async function expectDenied(
  page: import('@playwright/test').Page,
  path: string,
  forbiddenHeading: string,
) {
  await page.goto(path);
  const forbiddenVisible = await page.getByRole('heading', { name: forbiddenHeading }).isVisible().catch(() => false);
  if (forbiddenVisible) {
    throw new Error(`Forbidden page loaded on ${path} with heading "${forbiddenHeading}"`);
  }
}

test.describe('RBAC routes', () => {
  test('ADMIN route matrix', async ({ page }) => {
    await loginAs(page, adminEmail, adminPassword, 'ADMIN');

    await expectAllowed(page, '/admin/dashboard');
    await expectAllowed(page, '/admin/users');
    await expectAllowed(page, '/admin/audit-logs');
    await expectAllowed(page, '/admin/inventory');
    await expectAllowed(page, '/admin/payments');
  });

  test('LOGISTIQUE route matrix', async ({ page }) => {
    await loginAs(page, logiEmail, logiPassword, 'LOGISTIQUE');

    await expectAllowed(page, '/logistique/dashboard');
    await expectAllowed(page, '/logistique/orders');
    await expectAllowed(page, '/logistique/inventory');
    await expectAllowed(page, '/logistique/shipments');

    await expectDenied(page, '/admin/users', 'Users');
    await expectDenied(page, '/comptabilite/payments', 'Payments');
    await expectDenied(page, '/admin/audit-logs', 'Audit Logs');
  });

  test('COMPTABILITE route matrix', async ({ page }) => {
    await loginAs(page, comptaEmail, comptaPassword, 'COMPTABILITE');

    await expectAllowed(page, '/comptabilite/dashboard');
    await expectAllowed(page, '/comptabilite/orders');
    await expectAllowed(page, '/comptabilite/payments');
    await expectAllowed(page, '/comptabilite/coupons');

    await expectDenied(page, '/admin/users', 'Users');
    await expectDenied(page, '/logistique/inventory', 'Inventory');
    await expectDenied(page, '/admin/audit-logs', 'Audit Logs');
  });
});

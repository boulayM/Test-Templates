import { test, expect, type Page } from '@playwright/test';

const apiUrl = process.env.E2E_API_URL || 'http://localhost:3000/api';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin1@test.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'Admin123!';
const logiEmail = process.env.E2E_LOGI_EMAIL || 'logi1@test.local';
const logiPassword = process.env.E2E_LOGI_PASSWORD || 'User123!';
const comptaEmail = process.env.E2E_COMPTA_EMAIL || 'compta1@test.local';
const comptaPassword = process.env.E2E_COMPTA_PASSWORD || 'User123!';

async function ensureApiUp(page: Page) {
  try {
    const res = await page.request.get(`${apiUrl}/csrf`);
    if (!res.ok()) test.skip(true, 'API not reachable');
  } catch {
    test.skip(true, 'API not reachable');
  }
}

async function loginAs(page: Page, email: string, password: string, roleLabel: string) {
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
  await page.waitForURL(/\/(admin|logistique|comptabilite)\/dashboard/, { timeout: 10000 });
}

test.describe('Role dashboards UI', () => {
  test('ADMIN sees admin dashboard sections', async ({ page }) => {
    await loginAs(page, adminEmail, adminPassword, 'ADMIN');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Audit logs', exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Manage users' }).click();
    await expect(page).toHaveURL(/\/admin\/users$/);
  });

  test('LOGISTIQUE sees logistics dashboard only', async ({ page }) => {
    await loginAs(page, logiEmail, logiPassword, 'LOGISTIQUE');
    await expect(page.getByRole('heading', { name: 'Dashboard Logistique' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent audit logs' })).toHaveCount(0);

    await page.locator('main').getByRole('link', { name: 'Inventory', exact: true }).click();
    await expect(page).toHaveURL(/\/logistique\/inventory$/);
  });

  test('COMPTABILITE sees accounting dashboard only', async ({ page }) => {
    await loginAs(page, comptaEmail, comptaPassword, 'COMPTABILITE');
    await expect(page.getByRole('heading', { name: 'Dashboard Comptabilite' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Audit logs' })).toHaveCount(0);

    await page.locator('main').getByRole('link', { name: 'Payments', exact: true }).click();
    await expect(page).toHaveURL(/\/comptabilite\/payments$/);
  });
});

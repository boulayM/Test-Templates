import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const apiUrl = process.env.E2E_API_URL || 'http://localhost:3000/api';

async function login(page: import('@playwright/test').Page) {
  await page.addInitScript((url) => {
    (window as any).__env = { ...(window as any).__env, API_URL: url };
  }, apiUrl);

  await page.goto('/login');
  await page.getByLabel('Email').fill(adminEmail || '');
  await page.getByLabel('Mot de passe').fill(adminPassword || '');
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test('redirects to access-denied when unauthenticated', async ({ page }) => {
  await page.addInitScript((url) => {
    (window as any).__env = { ...(window as any).__env, API_URL: url };
  }, apiUrl);

  await page.context().clearCookies();
  await page.goto('/users');
  await expect(page).toHaveURL(/access-denied/);
  await expect(page.getByRole('heading', { name: 'Erreur' })).toBeVisible();
});

test('login + logout flow', async ({ page }) => {
  test.skip(process.env.E2E_RUN_LOGOUT !== '1', 'Set E2E_RUN_LOGOUT=1 to run this test');
  test.skip(!adminEmail || !adminPassword, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');
  await login(page);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login/);
});

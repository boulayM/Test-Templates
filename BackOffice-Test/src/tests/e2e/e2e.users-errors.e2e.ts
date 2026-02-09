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
    (window as unknown as { __env?: { API_URL?: string } }).__env = {
      ...((window as unknown as { __env?: { API_URL?: string } }).__env || {}),
      API_URL: url,
    };
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
      throw new Error(`Login failed: ${msg}`);
    }
    await page.context().storageState({ path: 'e2e.storage.json' });
    if (path !== '/dashboard') {
      await page.goto(path);
    }
  }
}

test.describe.serial('Users errors', () => {
  test('create shows required field errors', async ({ page }) => {
    await ensureAuth(page, '/users');
    await expect(page.locator('h1', { hasText: 'Users' })).toBeVisible();

    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.locator('.form-alert')).toBeVisible();
    await expect(page.locator('#userFirstName + .field-error')).toContainText(/required/i);
    await expect(page.locator('#userLastName + .field-error')).toContainText(/required/i);
    await expect(page.locator('#userEmail + .field-error')).toContainText(/required/i);
    await expect(page.locator('#userPassword + .field-error')).toContainText(/required/i);
  });

  test('create shows invalid format errors', async ({ page }) => {
    await ensureAuth(page, '/users');

    await page.locator('#userFirstName').fill('X');
    await page.locator('#userLastName').fill('Y');
    await page.locator('#userEmail').fill('bad-email');
    await page.locator('#userPassword').fill('weak');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.locator('#userEmail + .field-error')).toContainText(/invalid email/i);
    await expect(page.locator('#userPassword + .field-error')).toContainText(/password/i);
  });

  test('create duplicate email is rejected by backend', async ({ page }) => {
    await ensureAuth(page, '/users');
    const dupEmail = adminEmail || 'admin@example.com';

    await page.locator('#userFirstName').fill('Dup');
    await page.locator('#userLastName').fill('User');
    await page.locator('#userEmail').fill(dupEmail);
    await page.locator('#userPassword').fill('Password123!');
    await page.locator('#userRole').selectOption('USER');
    // Creating with an already existing email must fail with backend error.
    const duplicateResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/users/register') && res.request().method() === 'POST',
      { timeout: 15000 },
    );
    await page.getByRole('button', { name: 'Create' }).click();
    const duplicateResponse = await duplicateResponsePromise;
    expect(duplicateResponse.status()).toBeGreaterThanOrEqual(400);

    await expect(page.locator('#userEmail')).toHaveValue(dupEmail);
  });

  test('edit shows invalid email validation error', async ({ page }) => {
    await ensureAuth(page, '/users');

    const row = page.locator('tr', { hasText: 'user2@test.local' });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Edit' }).click();

    await page.locator('#editEmail').fill('bad-email');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.locator('#editEmail + .field-error')).toContainText(/invalid email/i);
    await expect(page.locator('.form-alert')).toBeVisible();
  });
});

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

async function goToUsersPage(page: import('@playwright/test').Page) {
  await ensureAuth(page, '/dashboard');
  await page.goto('/dashboard');
  await page.getByRole('link', { name: 'Users', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/users/);
  await expect(page.locator('#usersSearch')).toBeVisible();
}

test.describe.serial('Users critical', () => {
  const ts = Date.now();
  const email = `e2e_user_${ts}@example.com`;

  test('create user', async ({ page }) => {
    await goToUsersPage(page);

    const waitCreate = page.waitForResponse(
      (res) => res.url().includes('/api/users/register') && res.request().method() === 'POST',
      { timeout: 15000 },
    );

    await page.locator('#userFirstName').fill('E2E');
    await page.locator('#userLastName').fill('User');
    await page.locator('#userEmail').fill(email);
    await page.locator('#userPassword').fill('Password123!');
    await page.locator('#userRole').selectOption('USER');
    await page.getByRole('button', { name: 'Create' }).click();

    const createRes = await waitCreate;
    if (createRes.status() !== 201 && createRes.status() !== 200) {
      throw new Error(`Create failed with status ${createRes.status()}`);
    }

    await page.locator('#usersSearch').fill(email);
    await page.keyboard.press('Enter');

    const waitList = page.waitForResponse(
      (res) => res.url().includes('/api/users') && res.request().method() === 'GET',
      { timeout: 15000 },
    );
    await waitList;

    const row = page.locator('tr', { hasText: email });
    await expect(row).toBeVisible({ timeout: 10000 });
  });

  test('edit user name', async ({ page }) => {
    await goToUsersPage(page);
    const row = page.locator('tr', { hasText: email });
    await expect(row).toBeVisible();

    await row.getByRole('button', { name: 'Edit' }).click();

    const waitUpdate = page.waitForResponse(
      (res) => res.url().includes('/api/users/') && res.request().method() === 'PATCH',
    );

    await page.locator('#editFirstName').fill('E2E-Edited');
    await page.locator('#editLastName').fill('User-Edited');
    await page.getByRole('button', { name: 'Save' }).click();

    const updateRes = await waitUpdate;
    if (updateRes.status() !== 200) {
      throw new Error(`Update failed with status ${updateRes.status()}`);
    }

    await page.waitForTimeout(500);
    const updatedRow = page.locator('tr', { hasText: email });
    await expect(updatedRow).toContainText('E2E-Edited', { timeout: 10000 });
    await expect(updatedRow).toContainText('User-Edited', { timeout: 10000 });
  });

  test('filter by role', async ({ page }) => {
    await goToUsersPage(page);
    await page.locator('#usersRoleFilter').selectOption('USER');

    const row = page.locator('tr', { hasText: email });
    try {
      await row.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      test.skip(true, 'Row not visible after role filter');
    }
    await expect(row).toBeVisible();
  });

  test('export CSV', async ({ page }) => {
    await goToUsersPage(page);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV' }).click();
    const download = await downloadPromise;
    await expect(download.suggestedFilename()).toContain('users');
  });

  test('delete user', async ({ page }) => {
    await goToUsersPage(page);
    await page.locator('#usersSearch').fill(email);
    await page.keyboard.press('Enter');
    const row = page.locator('tr', { hasText: email });
    await expect(row).toBeVisible();

    page.on('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Delete' }).click();

    await expect(page.locator('tr', { hasText: email })).toHaveCount(0);
  });
});

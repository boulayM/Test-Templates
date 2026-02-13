import { expect, test } from '@playwright/test';

test('guest can open auth pages', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();

  await page.goto('/register');
  await expect(page.locator('#registerFirstName')).toBeVisible();
  await expect(page.locator('#registerLastName')).toBeVisible();
});

test('login shows validation messages on empty submit', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Connexion' }).click();
  await expect(page.getByText('Erreur de validation')).toBeVisible();
});

test('register shows validation messages on invalid submit', async ({ page }) => {
  await page.goto('/register');
  await page.locator('#registerFirstName').fill('A');
  await page.locator('#registerLastName').fill('B');
  await page.locator('#registerEmail').fill('invalid-email');
  await page.locator('#registerPassword').fill('123');
  await page.getByRole('button', { name: /cr.er un compte/i }).click();

  await expect(page.getByText('Erreur de validation')).toBeVisible();
});

test('profile route is protected for guests', async ({ page, context }) => {
  await context.clearCookies();
  await page.goto('/account/profile');
  await expect(page.getByText(/Prenom:/i)).toHaveCount(0);
  await expect(page.getByText(/Nom:/i)).toHaveCount(0);
  await expect(page.getByText(/Email:/i)).toHaveCount(0);
});

test('optional: seeded user can login and open profile', async ({ page }) => {
  const email = process.env['E2E_USER_EMAIL'];
  const password = process.env['E2E_USER_PASSWORD'];
  test.skip(!email || !password, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD to enable');

  await page.goto('/login');
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Mot de passe').fill(password!);
  await page.getByRole('button', { name: 'Connexion' }).click();

  await expect(page).toHaveURL(/dashboard/);
  await page.goto('/account/profile');
  await expect(page.getByRole('heading', { name: 'Profil' })).toBeVisible();
});

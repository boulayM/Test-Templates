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
  await expect(page.getByRole('heading', { name: 'Inscription' })).toBeVisible();
  await expect(page.getByText('Le formulaire est present mais volontairement desactive.')).toBeVisible();
  await expect(page.getByRole('button', { name: /creer un compte/i })).toBeDisabled();
});

test('profile route is protected for guests', async ({ page, context }) => {
  await context.clearCookies();
  await page.goto('/account/profile');
  await expect(page).toHaveURL(/\/login\?redirect=%2Faccount%2Fprofile$/);
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
});

test('optional: provided e2e user can login and open profile', async ({ page }) => {
  const email = process.env['E2E_USER_EMAIL'];
  const password = process.env['E2E_USER_PASSWORD'];
  test.skip(!email || !password, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD to enable');

  await page.goto('/login');
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Mot de passe').fill(password!);
  await page.getByRole('button', { name: 'Connexion' }).click();

  await expect(page).toHaveURL(/\/account\/profile$/);
  await expect(page.getByRole('heading', { name: 'Mon compte' })).toBeVisible();
});

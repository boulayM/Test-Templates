import { test, expect } from '@playwright/test';

test('public shell smoke', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveTitle(/Ma Boutique \| Accueil/);
  await expect(page.getByRole('link', { name: 'Accueil', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Catalogue', exact: true })).toBeVisible();
});

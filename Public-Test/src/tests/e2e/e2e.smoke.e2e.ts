import { test, expect } from '@playwright/test';

test('public shell smoke', async ({ page }) => {
  await page.goto('/home');
  await expect(
    page.getByRole('heading', { name: 'Produits disponibles' }),
  ).toBeVisible();
});

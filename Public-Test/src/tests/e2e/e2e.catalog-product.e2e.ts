import { expect, test } from '@playwright/test';

test.describe('catalog and product detail', () => {
  test('catalog exposes product cards and category links', async ({ page }) => {
    await page.goto('/catalog');

    await expect(page).toHaveTitle(/Ma Boutique \| Catalogue/);
    await expect(page.getByRole('heading', { name: 'Produits disponibles' })).toBeVisible();

    const firstCard = page.locator('.product-card').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByRole('link', { name: /Voir le detail/i })).toBeVisible();
    await expect(firstCard.locator('.ui-product-price--catalog')).toBeVisible();
    await expect(firstCard.locator('.ui-status-badge')).toBeVisible();
  });

  test('catalog category query narrows the visible list', async ({ page }) => {
    await page.goto('/catalog');

    await expect(page.getByRole('heading', { name: 'Produits disponibles' })).toBeVisible();
    const firstCategoryLink = page.locator('nav').nth(1).getByRole('link').first();
    await expect(firstCategoryLink).toBeVisible();

    const href = await firstCategoryLink.getAttribute('href');
    expect(href).toBeTruthy();

    await page.goto(href!);
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    const cards = page.locator('.product-card');
    const emptyState = page.getByText('Aucun produit ne correspond aux filtres en cours.');
    await expect(cards.first().or(emptyState)).toBeVisible();
  });

  test('product detail exposes price, rating and buy action', async ({ page }) => {
    await page.goto('/catalog');

    const firstProductLink = page.locator('.product-card a').first();
    await firstProductLink.click();

    await expect(page).toHaveURL(/\/products\/.+$/);
    await expect(page.locator('.product-summary h1')).toBeVisible();
    await expect(page.locator('.ui-product-price--detail')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ACHETER' })).toBeVisible();
    await expect(page.getByText(/Note moyenne/i)).toBeVisible();
  });

  test('guest buy action opens the access modal', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/catalog');

    await page.locator('.product-card a').first().click();
    await page.getByRole('button', { name: 'ACHETER' }).click();

    await expect(page.getByText('Vous devez être connecté pour pouvoir acheter')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Créer un compte' })).toBeVisible();
  });
});

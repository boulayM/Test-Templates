import { test, expect } from '@playwright/test';

test.describe('seo', () => {
  test('home exposes expected SEO tags', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveTitle(/Ma Boutique \| Accueil/);

    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toBe('index,follow');

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/\/home$/);

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Ma Boutique/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-default\.svg/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');

    await expect(page.locator('script#app-jsonld-seo[type="application/ld+json"]')).toHaveCount(1);
  });

  test('auth page is noindex', async ({ page }) => {
    await page.goto('/verify-email?token=dummy');
    await expect(page).toHaveURL(/\/verify-email\?token=dummy$/);
    await expect(page).toHaveTitle(/Verification email/);
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toBe('noindex,nofollow');
  });
});

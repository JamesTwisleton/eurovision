import { test, expect } from '@playwright/test';

test.describe('Eurovision Jury App', () => {
  test('should allow navigating to home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('EUROVISION');
  });

  test('should show how it works section on home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h3:has-text("How It Works")')).toBeVisible();
    await expect(page.locator('ol li')).toHaveCount(4);
  });
});

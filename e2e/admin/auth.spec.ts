import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test('should redirect unauthenticated users to login page', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('h1')).toContainText('ADMIN');
    await expect(page.locator('h2')).toContainText('RESTRICTED ACCESS');
  });

  test('should redirect unauthenticated users to login page when accessing juries', async ({ page }) => {
    await page.goto('/admin/juries');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

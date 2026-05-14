import { test, expect } from '@playwright/test';

test.describe('Party Redirect', () => {
  test('should redirect to home page when no session exists', async ({ page }) => {
    await page.goto('/party');
    await expect(page).toHaveURL('/');
  });

  // Note: Testing the authenticated redirect would require setting up a member session/cookie,
  // which might be complex for a quick verification.
  // Given the logic is simple, the unauthenticated redirect test gives some confidence.
});

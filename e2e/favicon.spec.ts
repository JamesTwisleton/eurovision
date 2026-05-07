import { test, expect } from '@playwright/test';

test('favicon is present and is an SVG', async ({ page }) => {
  await page.goto('/');
  // Next.js App Router metadata generates a link[rel="icon"] for icon.svg
  const favicon = page.locator('link[rel="icon"][type="image/svg+xml"]');
  await expect(favicon).toBeAttached();

  const href = await favicon.getAttribute('href');
  const type = await favicon.getAttribute('type');

  console.log('Favicon href:', href);
  console.log('Favicon type:', type);

  expect(href).toMatch(/icon\.svg|icon\d*\.svg/);
  expect(type).toBe('image/svg+xml');
});

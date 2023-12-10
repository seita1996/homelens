import { test, expect } from '@playwright/test';

test('top page screenshot', async ({ page }, testInfo) => {
  await page.goto('http://localhost:3000/');

  // wait websocket connection
  await page.waitForTimeout(5000);

  const screenshot = await page.screenshot();
  await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
});

// test('get started link', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Click the get started link.
//   await page.getByRole('link', { name: 'Get started' }).click();

//   // Expects page to have a heading with the name of Installation.
//   await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
// });

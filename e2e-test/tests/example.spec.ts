import { test, expect } from '@playwright/test';

test('top page screenshot', async ({ page, browserName }, testInfo) => {
  await page.goto('http://localhost:3000/');

  // wait websocket connection
  await page.waitForTimeout(5000);

  const screenshot = await page.screenshot({ path: `tmp/${browserName}.png` });
  await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
});

test('a card representing your connection is displayed', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // wait websocket connection
  await page.waitForTimeout(5000);

  await expect(page.getByText(/.+\(me\)$/i)).toBeVisible();
});

import { test, expect } from '@playwright/test';

test('Browser version', async ({ browser }) => {
  const version = await browser.version();
  console.log('Browser version:', version);
  expect(version).not.toBe(null);
});
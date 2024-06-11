import { test, expect } from '@playwright/test';

test('Browser version', async ({ browser }) => {
  test.info().annotations.push({
    type: 'browser version',
    description: browser.version(),
  });

  const version = await browser.version();
  console.log('Browser version:', version);
  expect(version).not.toBe(null);
});
import { test, expect } from '@playwright/test';

test.describe('FreeQueue tests', () => {
  test('free-queue.test.html should not have errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/src/lib/free-queue/test/free-queue.test.html', { waitUntil: 'networkidle' });
    await page.click('#run-tests');
    await page.waitForTimeout(1000); // Wait for tests to run

    expect(errors).toHaveLength(0);
  });

  test('free-queue-sab.test.html should not have errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/src/lib/free-queue/test/free-queue-sab.test.html', { waitUntil: 'networkidle' });
    await page.click('#run-tests');
    await page.waitForTimeout(1000); // Wait for tests to run

    expect(errors).toHaveLength(0);
  });
});

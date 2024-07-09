import { test, expect } from '@playwright/test';

// Capture test console logs
test.beforeEach(async ({ page }) =>
  page.on('console', msg =>
    console[msg.type() === 'assert' ? 'error' : msg.type()](msg.text())
  )
);

// Check if test passed
test.afterEach(async ({ page }) => {
  // @ts-ignore
  const result = await page.evaluate(() => webAudioEvaluate);
  expect(result).toBeTruthy();
});


//-----------------------------------------------------------------------------
// TEST SUITE
//-----------------------------------------------------------------------------
test('Hello Sine (realtime)', async ({ page }) => {
  await page.goto('pages/realtime-sine.html');
});

test('Hello Sine (offline)', async ({page}) => {
  await page.goto('pages/offline-sine.html');
});

test('Web Audio Graph Evaluation', async ({page}) => {
  await page.goto('pages/web-audio-graph-evaluation.html');
});

//-----------------------------------------------------------------------------
// Performance Suite
//-----------------------------------------------------------------------------
test('Gain Performance', async ({page}) => {
  await page.goto('pages/perf-gain.html');
});

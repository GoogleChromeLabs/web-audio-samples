import { test, expect } from '@playwright/test';

// Listen for all console logs
test.beforeEach(async ({ page }) =>
  page.on('console', msg =>
    console[msg.type() === 'assert' ? 'error' : msg.type()](msg.text())
  )
);


test('Hello Sine (realtime)', async ({ page }) => {
  await page.goto('pages/realtime-sine.html');
  const result = await page.evaluate(() => (window as any).evaluate);
  expect(result).toBeTruthy();
});

// @ts-ignore
test('Hello Sine (offline)', async ({page}) => {
  const sampleRate = 44100;
  const length = 1;
  const numChannels = 1;
  const freq = 441;

  await page.goto('pages/offline-sine.html');

  // Await promise from bufferData containing float32Array
  const bufferObject = await page.evaluate(() => (window as any).test);
  const bufferData =
    new Float32Array((Object as any).values(bufferObject.buffer));

  // Check bufferData period / frequency
  expect(bufferData.length).toBe(sampleRate * length * numChannels);
  expect(bufferData[0]).toBe(0);
  expect(bufferData[1]).not.toBe(0); // sine wave first elem should be non-zero
  expect(bufferData[sampleRate / freq]).toBe(0); // 1 period, back to 0
});


test('DSP Graph Evaluation', async ({page}) => {
  await page.goto('pages/dsp-graph-evaluation.html');
  const graphEvalPromise = await page.evaluate(() => (window as any).test);
  expect(graphEvalPromise.score).toBeGreaterThan(.9999);
});

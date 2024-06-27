import { test, expect } from '@playwright/test';
import { beCloseTo } from './resources/audit';
import fs from 'fs';

test('Hello Sine (realtime)', async ({ page }) => {
  await page.goto('pages/realtime-sine.html');

  // wait for the recordBufferPromise to resolve to recorded audio buffer
  const recordBufferPromise =
    await page.evaluate(() => (window as any).tests.recordBufferPromise);
  const bufferData = new Float32Array((Object as any).values(recordBufferPromise.buffer));

  // load in reference samples (python numpy generated)
  const myRef = JSON.parse(fs.readFileSync('src/tests/playwright/reference/440@48k-sine.json', 'utf8'));
  const myRefData = new Float32Array(myRef);

  // compare bufferData samples to reference
  let numCorrect = 0;
  for (let i = 0; i < bufferData.length; i++) {
    numCorrect += beCloseTo(bufferData[i], myRefData[i], 0.001) ? 1 : 0;
  }

  // expect 99.99% 
  expect(numCorrect / bufferData.length).toBeGreaterThan(.9999); 
});

// @ts-ignore
test('Hello Sine (offline)', async ({page}) => {
  const sampleRate = 44100;
  const length = 1;
  const numChannels = 1;
  const freq = 441;

  await page.goto('pages/offline-sine.html');

  // Await promise from bufferData containing float32Array
  const bufferObject = await page.evaluate(() => (window as any).tests.bufferDataPromise);
  const bufferData =
    new Float32Array((Object as any).values(bufferObject));

  // Check bufferData period / frequency
  expect(bufferData.length).toBe(sampleRate * length * numChannels);
  expect(bufferData[0]).toBe(0);
  expect(bufferData[1]).not.toBe(0); // sine wave first elem should be non-zero
  expect(bufferData[sampleRate / freq]).toBe(0); // 1 period, back to 0
});

// @ts-ignore
test('AudioWorklet Add Module Resolution', async ({page}) => {
  await page.goto('pages/audioworklet-addmodule-resolution.html');

  const addModulesPromise = await page.evaluate(() => (window as any).tests.addModulesPromise);

  // module loading after realtime context creation
  const realtimeDummyWorkletLoaded = await page.evaluate(() => realtimeDummyWorkletLoaded);
  expect(
      realtimeDummyWorkletLoaded,
      'dummyWorkletNode is an instance of AudioWorkletNode from realtime context')
      .toBe(true);

  // module loading after offline context creation
  const offlineDummyWorkletLoaded = await page.evaluate(() => offlineDummyWorkletLoaded);
  expect(
    offlineDummyWorkletLoaded,
    'dummyWorkletNode is an instance of AudioWorkletNode from offline context')
    .toBe(true);
});

test('DSP Graph Evaluation', async ({page}) => {
  await page.goto('pages/dsp-graph-evaluation.html');
  const graphEvalPromise = await page.evaluate(() => (window as any).tests.graphEvalPromise);
  expect(graphEvalPromise.score).toBeGreaterThan(.9999);
});

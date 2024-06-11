import { test, expect } from '@playwright/test';

test('Hello Sine (realtime)', async ({ page }) => {
  await page.goto('pages/realtime-sine.html');
  await page.click('#start');

  const osc = await page.evaluateHandle(object => osc);

  // Check 440Hz
  const f1 = await osc.getProperty('frequency');
  const f1Val = await f1.getProperty('value');
  expect(await f1Val.jsonValue()).toBe(440);

  // wait for the updateFrequency promise to resolve
  const updateFrequencyPromise = await page.evaluate(() => updateFrequencyPromise);

  // Check 880Hz
  const f2 = await osc.getProperty('frequency');
  const f2Val = await f2.getProperty('value');
  expect(await f2Val.jsonValue()).toBe(880);

  await page.waitForTimeout(1000);
});

test('Hello Sine (offline)', async ({ page }) => {
  const sampleRate = 44100;
  const length = 1;
  const numChannels = 1;
  const freq = 441;

  await page.goto('pages/offline-sine.html');

  // Await promise from bufferData containing float32Array but 
  // playwright evaluates only to Object
  const bufferObject = await page.evaluate(object => bufferData);
  const bufferData = new Float32Array(Object.values(bufferObject));

  expect(bufferData.length).toBe(sampleRate * length * numChannels);
  expect(bufferData[0]).toBe(0); 
  expect(bufferData[1]).not.toBe(0); // sine wave should now be non-zero
  expect(bufferData[sampleRate / freq]).toBe(0); // 1 period, back to 0
});

test('AudioWorklet Add Module Resolution', async ({ page }) => {
  await page.goto('pages/audioworklet-addmodule-resolution.html');

  const addModulesPromise = await page.evaluate(() => addModulesPromise);

  // module loading after realtime context creation
  const realtimeDummyWorkletLoaded = await page.evaluate(boolean => realtimeDummyWorkletLoaded);
  expect(
    realtimeDummyWorkletLoaded, 
    'dummyWorkletNode is an instance of AudioWorkletNode from realtime context')
    .toBe(true);

  // module loading after offline context creation
  const offlineDummyWorkletLoaded = await page.evaluate(boolean => offlineDummyWorkletLoaded);
  expect(
    offlineDummyWorkletLoaded, 
    'dummyWorkletNode is an instance of AudioWorkletNode from offline context')
    .toBe(true);
});
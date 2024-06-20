import {test, expect} from '@playwright/test';
import fs from 'fs';

import { exec } from 'child_process';

// exec('python3 src/tests/playwright/run.py', (error, stdout, stderr) => {
//   fs.writeFileSync('src/tests/playwright/temp/hello.txt', stdout);
// });

// Python process
test('Hello Sine (realtime)', async ({ page }) => {
  await page.goto('pages/realtime-sine.html');

  // wait for the updateFrequency promise to resolve
  const updateFrequencyPromise = await page.evaluate(() => updateFrequencyPromise);
  const bufferData = new Float32Array((Object as any).values(updateFrequencyPromise.buffer));

  const tempFile = 'src/tests/playwright/temp/temp.json';
  fs.writeFileSync(tempFile, JSON.stringify(bufferData));
});

/*
test('Hello Sine (realtime)', async ({ page }) => {
  await page.goto('pages/realtime-sine.html');

  // wait for the updateFrequency promise to resolve
  const updateFrequencyPromise =
    await page.evaluate(() => updateFrequencyPromise);
  const bufferData =
    new Float32Array((Object as any).values(updateFrequencyPromise.buffer));

  // load in reference json file
  const myRef = JSON.parse(fs.readFileSync('src/tests/playwright/ref/440@48k-sine.json', 'utf8'));
  const myRefData = new Float32Array(myRef);

  // compare all samples
  let numCorrect = 0;
  for (let i = 0; i < myRefData.length; i++) {
    if (Math.abs(bufferData[i] - myRefData[i]) < 0.0002) {
      numCorrect++;
    }
  }
  expect(numCorrect / myRefData.length).toBeGreaterThan(.9999);
});

// @ts-ignore
test('Hello Sine (offline)', async ({page}) => {
  const sampleRate = 44100;
  const length = 1;
  const numChannels = 1;
  const freq = 441;

  await page.goto('pages/offline-sine.html');

  // Await promise from bufferData containing float32Array but
  // playwright evaluates only to Object
  const bufferObject = await page.evaluate(() => bufferData);
  const bufferData =
    new Float32Array((Object as any).values(bufferObject));

  expect(bufferData.length).toBe(sampleRate * length * numChannels);
  expect(bufferData[0]).toBe(0);
  expect(bufferData[1]).not.toBe(0); // sine wave should now be non-zero
  expect(bufferData[sampleRate / freq]).toBe(0); // 1 period, back to 0
});

// @ts-ignore
test('AudioWorklet Add Module Resolution', async ({page}) => {
  await page.goto('pages/audioworklet-addmodule-resolution.html');

  const addModulesPromise = await page.evaluate(() => addModulesPromise);

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
*/

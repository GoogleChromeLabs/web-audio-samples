import { test, expect } from '@playwright/test';

test('Hello Sine Test (realtime)', async ({ page }) => {
  await page.goto("pages/realtime-sine.html");

  const h1 = await page.$('h1');
  const text = await h1?.textContent();
  expect(text).toBe('Realtime Sine Test');

  const osc = await page.evaluateHandle(object => osc);

  await page.click('#start');

  // Check 440Hz
  const f1 = await osc.getProperty('frequency');
  const f1Val = await f1.getProperty('value');
  expect(await f1Val.jsonValue()).toBe(440);

  await page.waitForTimeout(1000);

  // Check 880Hz
  const f2 = await osc.getProperty('frequency');
  const f2Val = await f2.getProperty('value');
  expect(await f2Val.jsonValue()).toBe(880);
});

test('Hello Sine Test (offline)', async ({ page }) => {
  const sampleRate = 44100;
  const length = 1;
  const numChannels = 1;
  const freq = 441;

  await page.goto("pages/offline-sine.html");

  // Await promise from bufferData containing float32Array but 
  // playwright evaluates only to Object
  const bufferObject = await page.evaluate(object => bufferData);
  const bufferData = new Float32Array(Object.values(bufferObject));

  expect(bufferData.length).toBe(sampleRate * length * numChannels);
  expect(bufferData[0]).toBe(0); 
  expect(bufferData[1]).not.toBe(0); // sine wave should now be non-zero
  expect(bufferData[sampleRate / freq]).toBe(0); // 1 period, back to 0
});
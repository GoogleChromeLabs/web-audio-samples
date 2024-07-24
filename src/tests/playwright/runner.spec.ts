/**
 * @fileoverview Web Audio Test Suite using the Playwright Framework.
 * Playwright will navigate and run each HTML page, capture logs,
 * and finally check if the `evaluate` function which sets `webAudioEvaluate`
 * returns true.
 */
import {test, expect} from '@playwright/test';

// Capture test console logs
test.beforeEach(async ({page}) =>
  page.on('console', (msg) =>
    console[msg.type() === 'assert' ? 'error' : msg.type()](msg.text()),
  ),
);

// Check if test passed
test.afterEach(async ({page}) => {
  // @ts-ignore
  // eslint-disable-next-line no-undef
  // noinspection TypeScriptUnresolvedReference
  const result = await page.evaluate(() => webAudioEvaluate);
  expect(result).toBeTruthy();
});


// -----------------------------------------------------------------------------
// TEST SUITE
// -----------------------------------------------------------------------------
test('Hello Sine (realtime)', async ({page}) => {
  await page.goto('pages/realtime-sine.html');
});

// -----------------------------------------------------------------------------
// PERFORMANCE SUITE
// -----------------------------------------------------------------------------
test('Performance Gain Test', async ({page}) => {
  await page.goto('pages/perf-gain-node.html');
});

test('Performance Panner Test', async ({page}) => {
  await page.goto('pages/perf-panner-node.html');
});

test('Performance Timeline Insert Event Test', async ({page}) => {
  await page.goto('pages/perf-timeline-insert-event.html');
});

test('Performance Audio Buffer Source Test', async ({page}) => {
  await page.goto('pages/perf-audio-buffer-source-node.html');
});

test('Performance Audio Worklet Node Test', async ({page}) => {
  await page.goto('pages/perf-audio-worklet-node.html');
});

test('Performance Biquad Filter Node Test', async ({page}) => {
  await page.goto('pages/perf-biquad-filter-node.html');
});

test('Performance Dynamics Compressor Node (Knee) Test', async ({page}) => {
  await page.goto('pages/perf-dynamics-compressor-node-knee.html');
});

test('Performance Dynamics Compressor Node (Post-Knee) Test', async ({page}) => {
  await page.goto('pages/perf-dynamics-compressor-node-post-knee.html');
});

test('Performance Dynamics Compressor Node (Pre-Knee) Test', async ({page}) => {
  await page.goto('pages/perf-dynamics-compressor-node-pre-knee.html');
});
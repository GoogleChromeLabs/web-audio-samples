/**
 * @fileoverview Web Audio Test Suite using the Playwright Framework.
 * Playwright will navigate and run each HTML page, capture logs,
 * and finally check if the `evaluate` function which sets `webAudioEvaluate`
 * returns true.
 */
import {test, expect} from '@playwright/test';
import tests from './pages/tests.json';

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

test.describe('Benchmark Tests', () => {
  tests.benchmark.forEach(({name, path}) => {
    test(name, async ({page}) => {
      await page.goto(path);
    });
  });
});

test.describe('Performance Tests', () => {
  tests.performance.forEach(({name, path}) => {
    test(name, async ({page}) => {
      await page.goto(path);
    });
  });
});
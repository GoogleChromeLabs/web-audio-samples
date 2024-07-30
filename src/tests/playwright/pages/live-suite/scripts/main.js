/**
 * @fileoverview Initializes the Web Audio Test Suite by converting specified
 * HTML test files to interactive DOM elements.
 */
import {convertTestFiles} from './test-file-converter.js';

// Flag for live test suite environment
window._isTestSuiteMode = true;

const testEnded = () =>
  new Promise((resolve) => window._webAudioTestEnded = resolve);
document.querySelector('#run-all').addEventListener('click', async () => {
  const buttons = document.querySelectorAll('button[data-type=test]');
  for (const button of buttons) {
    button.click();
    await testEnded();
  }
});

(async () => {
  const tests = await (await fetch('tests.json')).json();

  document.querySelector('#total').innerText =
      Object.values(tests).reduce((sum, group) => sum + group.length, 0);

  convertTestFiles([
    ...tests.benchmark.map((test) => test.path),
    ...tests.performance.map((test) => test.path),
  ]);
})();

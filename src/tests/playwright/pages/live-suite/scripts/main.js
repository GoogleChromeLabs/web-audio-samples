/**
 * @fileoverview Initializes the Web Audio Test Suite by converting specified
 * HTML test files to interactive DOM elements.
 */
import {convertTestFiles} from './test-file-converter.js';

// Flag for live test suite environment
window._isTestSuiteMode = true;

(async () => {
  const tests = await (await fetch('tests.json')).json();

  convertTestFiles([
    ...tests.benchmark.map((test) => test.path),
    ...tests.performance.map((test) => test.path),
  ]);
})();

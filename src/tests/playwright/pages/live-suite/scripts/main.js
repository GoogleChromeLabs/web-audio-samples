/**
 * @fileoverview Initializes the Web Audio Test Suite by converting specified
 * HTML test files to interactive DOM elements.
 */
import {convertTestFiles} from './test-file-converter.js';

// Flag for live test suite environment
window._isTestSuiteMode = true;

const files = [
  'realtime-sine.html',
  'perf-gain.html',
  'perf-panner.html',
];

convertTestFiles(files);

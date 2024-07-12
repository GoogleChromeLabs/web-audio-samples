/**
 * @fileoverview Initializes the Web Audio Test Suite by converting specified
 * HTML test files to interactive DOM elements.
 */
import {convertTestFiles} from './test-file-converter.js';

window._webAudioTestSuite = true;

const files = [
  'realtime-sine.html',
];

convertTestFiles(files);

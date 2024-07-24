/**
 * @fileoverview Initializes the Web Audio Test Suite by converting specified
 * HTML test files to interactive DOM elements.
 */
import {convertTestFiles} from './test-file-converter.js';

// Flag for live test suite environment
window._isTestSuiteMode = true;

const files = [
  'realtime-sine.html',
  'perf-gain-node.html',
  'perf-panner-node.html',
  'perf-timeline-insert-event.html',
  'perf-audio-buffer-source-node.html',
  'perf-audio-worklet-node.html',
  'perf-biquad-filter-node.html',
  'perf-dynamics-compressor-node-knee.html',
  'perf-dynamics-compressor-node-post-knee.html',
  'perf-dynamics-compressor-node-pre-knee.html',
];

convertTestFiles(files);

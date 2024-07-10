/**
 * @fileoverview Initializes the Web Audio Test Suite by converting specified
 * HTML test files to interactive DOM elements.
 */
import { convert } from "./converter.js";

window._webAudioSuite = true;

const files = [
  "realtime-sine.html",
  "offline-sine.html",
  "web-audio-graph-evaluation.html",
  "perf-gain.html"
];

convert(files);
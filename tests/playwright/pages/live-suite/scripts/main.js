import convert from './converter.js';

window.liveSuite = true;

const files = [
  'realtime-sine.html',
  'offline-sine.html',
  'dsp-graph-evaluation.html'
];

convert(files);

import convert from './converter.js';

const files = ['realtime-sine.html']
  .map(file => `./../playwright/pages/${ file }`);

convert(files);

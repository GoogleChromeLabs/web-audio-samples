import convert from './converter.js';

const files = ['realtime-sine.html', 'offline-sine.html', 'audioworklet-addmodule-resolution.html']
  .map(file => `./../playwright/pages/${ file }`);

convert(files);

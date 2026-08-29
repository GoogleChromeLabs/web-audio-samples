const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building v4-prototype with Astro...');
execSync('npm --prefix v4-prototype run build', { stdio: 'inherit' });

const src = path.join(__dirname, '../v4-prototype/dist');
const dest = path.join(__dirname, '../_site/v4-prototype');

console.log(`Copying ${src} to ${dest}...`);
fs.cpSync(src, dest, { recursive: true });
console.log('v4-prototype successfully bundled into _site/v4-prototype.');

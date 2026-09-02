const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const v4Dir = path.join(__dirname, '../v4-prototype');
console.log('Building v4-prototype with Astro...');
execSync('npm run build', { cwd: v4Dir, stdio: 'inherit' });

const src = path.join(v4Dir, 'dist');
const dest = path.join(__dirname, '../_site/v4-prototype');

console.log(`Copying ${src} to ${dest}...`);
fs.cpSync(src, dest, { recursive: true });
console.log('v4-prototype successfully bundled into _site/v4-prototype.');

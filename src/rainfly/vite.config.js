import {sveltekit} from '@sveltejs/kit/vite';
import {defineConfig} from 'vite';
import {readFileSync} from 'node:fs';

export default defineConfig({
  plugins: [sveltekit()],
  // REF: https://stackoverflow.com/a/72141502
  define: {
    meta: {version: JSON.parse(readFileSync('package.json', 'utf8')).version},
  },
});

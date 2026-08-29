import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Support serving under subpaths like /web-audio-samples/v4-prototype/
// when deployed on GitHub Pages or when custom ASTRO_BASE is provided.
const base =
  process.env.ASTRO_BASE ||
  (process.env.NODE_ENV === 'production'
    ? '/web-audio-samples/v4-prototype/'
    : '/');

export default defineConfig({
  site: 'https://googlechromelabs.github.io',
  base,
  vite: {
    plugins: [tailwindcss()],
  },
});

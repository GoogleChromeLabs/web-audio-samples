import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Support serving under subpaths like /web-audio-samples/v4-prototype/
// when deployed on GitHub Pages or when custom ASTRO_BASE is provided.
const base =
  process.env.ASTRO_BASE ||
  (process.env.NODE_ENV === 'production'
    ? '/web-audio-samples/v4-prototype/'
    : '/');

const MIME_TYPES = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.wasm': 'application/wasm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

/**
 * Scans src/content/guides/ for guide folders and discovers all co-located
 * companion assets (scripts, audio files, WASM, images, etc.).
 */
function getGuideAssets(guidesDir) {
  const assetMap = new Map();
  if (!fs.existsSync(guidesDir)) return assetMap;

  const entries = fs.readdirSync(guidesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const guideSlug = entry.name;
    const guideFolderPath = path.join(guidesDir, guideSlug);
    const indexPath = path.join(guideFolderPath, 'index.md');
    if (!fs.existsSync(indexPath)) continue;

    // Read category from frontmatter
    const content = fs.readFileSync(indexPath, 'utf-8');
    const match = content.match(/^category:\s*([^\r\n]+)/m);
    const category = match ? match[1].trim() : 'basic';

    function scanFolder(currentDir, relativePrefix = '') {
      const dirEntries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const dirEntry of dirEntries) {
        if (dirEntry.name.startsWith('.')) continue;
        const fullPath = path.join(currentDir, dirEntry.name);
        const relPath = relativePrefix
          ? `${relativePrefix}/${dirEntry.name}`
          : dirEntry.name;

        if (dirEntry.isDirectory()) {
          scanFolder(fullPath, relPath);
        } else if (dirEntry.isFile()) {
          if (relPath === 'index.md' || relPath === 'index.mdx') continue;
          const urlPath = `audio-worklet/${category}/${guideSlug}/${relPath}`;
          assetMap.set(urlPath, fullPath);
        }
      }
    }

    scanFolder(guideFolderPath);
  }

  return assetMap;
}

/**
 * Astro integration to serve and copy co-located guide companion assets.
 * In dev: Serves files via Vite middleware.
 * In build: Copies files to dist/audio-worklet/<category>/<slug>/.
 */
function guideAssetsIntegration() {
  const guidesDir = path.resolve('src/content/guides');
  let cachedGuideAssets = null;

  function getCachedAssets() {
    if (!cachedGuideAssets) {
      cachedGuideAssets = getGuideAssets(guidesDir);
    }
    return cachedGuideAssets;
  }

  return {
    name: 'guide-assets',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.watcher.on('all', (event, filePath) => {
          if (filePath.includes('src/content/guides')) {
            cachedGuideAssets = null;
          }
        });

        server.middlewares.use((req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

          const rawUrl = req.url?.split('?')[0] || '';
          let cleanPath = rawUrl.replace(/^\/+/, '');

          const cleanBase = base.replace(/^\/+|\/+$/g, '');
          if (cleanBase && cleanPath.startsWith(cleanBase + '/')) {
            cleanPath = cleanPath.slice(cleanBase.length + 1);
          }

          const guideAssets = getCachedAssets();
          const filePath = guideAssets.get(cleanPath);
          if (filePath && fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'no-cache');
            return fs.createReadStream(filePath).pipe(res);
          }
          next();
        });
      },
      'astro:build:done': async ({ dir }) => {
        const guideAssets = getGuideAssets(guidesDir);
        const outDir = fileURLToPath(dir);
        for (const [urlPath, sourceFilePath] of guideAssets) {
          const destPath = path.join(outDir, urlPath);
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copyFileSync(sourceFilePath, destPath);
        }
      },
    },
  };
}

export default defineConfig({
  site: 'https://googlechromelabs.github.io',
  base,
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  integrations: [guideAssetsIntegration()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
  },
});

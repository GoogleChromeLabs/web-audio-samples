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
 * Scans a content folder (guides or tests) and discovers all co-located
 * companion assets (scripts, audio files, WASM, images, etc.).
 */
function getContentAssets(contentDir, urlRoot) {
  const assetMap = new Map();
  if (!fs.existsSync(contentDir)) return assetMap;

  const entries = fs.readdirSync(contentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const itemSlug = entry.name;
    const folderPath = path.join(contentDir, itemSlug);
    const indexPath = path.join(folderPath, 'index.md');
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
          const urlPath = `${urlRoot}/${category}/${itemSlug}/${relPath}`;
          assetMap.set(urlPath, fullPath);
        }
      }
    }

    scanFolder(folderPath);
  }

  return assetMap;
}

/**
 * Astro integration to serve and copy co-located companion assets.
 * In dev: Serves files via Vite middleware.
 * In build: Copies files to dist/<urlRoot>/<category>/<slug>/.
 */
function companionAssetsIntegration() {
  const guidesDir = path.resolve('src/content/guides');
  const testsDir = path.resolve('src/content/tests');
  let cachedAssets = null;

  function getCachedAssets() {
    if (!cachedAssets) {
      const guideAssets = getContentAssets(guidesDir, 'audio-worklet');
      const testAssets = getContentAssets(testsDir, 'tests');
      cachedAssets = new Map([...guideAssets, ...testAssets]);
    }
    return cachedAssets;
  }

  return {
    name: 'companion-assets',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.watcher.on('all', (event, filePath) => {
          if (
            filePath.includes('src/content/guides') ||
            filePath.includes('src/content/tests')
          ) {
            cachedAssets = null;
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

          const assets = getCachedAssets();
          const filePath = assets.get(cleanPath);
          if (filePath && fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'no-cache');
            return fs.createReadStream(filePath).pipe(res);
          }

          // Auto-resolve index.html for directory URLs in public folder
          const publicIndexPath =
            path.resolve('public', cleanPath, 'index.html');
          if (fs.existsSync(publicIndexPath)) {
            res.setHeader('Content-Type', 'text/html;charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            return fs.createReadStream(publicIndexPath).pipe(res);
          }
          next();
        });
      },
      'astro:build:done': async ({ dir }) => {
        const assets = getCachedAssets();
        const outDir = fileURLToPath(dir);
        for (const [urlPath, sourceFilePath] of assets) {
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
  build: {
    assets: 'assets',
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  integrations: [companionAssetsIntegration()],
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

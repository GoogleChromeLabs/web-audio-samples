const CACHE_NAME = 'audio-recorder-v1';
const CACHE_URLS = [
  './',
  './app.mjs',
  './icons/android-chrome-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './indexeddb-storage.mjs',
  './site.webmanifest',
  './style.css',
  './visualize.mjs',
  // Google Fonts links to further files, which are not cached by
  // ServiceWorker. These files' cache headers allow the browser
  // to serve them when offline.
  'https://fonts.googleapis.com/css?family=Roboto:300,400,500',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css',
  'https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js',
];

self.addEventListener('install', (e) => {
  // When the user visits the website for the first time, populate the cache by
  // loading all specified URLs. All resources have been previously loaded to
  // display the website, so most HTTP requests should be immediately fulfilled
  // through the browser cache.
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CACHE_URLS);
  })());
});

self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    // Ignore the VARY header to make caching more robust. My local development
    // environment sets "Vary: Origin" and ServiceWorker requests remove the
    // Origin header, preventing preloaded resources from being matched.
    const cachedResponse = await caches.match(e.request, {ignoreVary: true});

    if (cachedResponse) {
      // The cache contains the requested resource. Return the cached resource
      // immediately and refresh the cache in the background.
      e.waitUntil(refreshCachedResponse(e.request, cachedResponse));
      return cachedResponse;
    } else {
      // The cache does not contain the requested resource. This happens for
      // files that are imported from third-party resources (e.g. Google
      // Fonts). In this case, we do NOT attempt to indefinitely cache the
      // results in the ServiceWorker and fall back to regular browser caching.
      return fetch(e.request);
    }
  })());
});

/**
 * Reloads a cached resource and updates the cache.
 *
 * If the ETag of the loaded resource differs from the cache, sends a message
 * to all clients instructing them to reload.
 *
 * @param {Request} request
 * @param {Response} cachedResponse
 */
async function refreshCachedResponse(request, cachedResponse) {
  let response;

  try {
    response = await fetch(request);
  } catch (e) {
    // Errors during refreshing resources in the background are acceptable.
    // Likely the client is offline.
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());

  if (response.headers.get('ETag') !== cachedResponse.headers.get('ETag')) {
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      console.log(`ETag of ${response.url} changed. Reloading ${client.id}`);
      client.postMessage({type: 'reload'});
    }
  }
}

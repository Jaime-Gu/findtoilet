/* FindToilet service worker
 * - precaches the app shell (pages, assets, cities index, map CDN deps)
 * - runtime cache-first for city GeoJSON, CDN libs and map tiles actually viewed
 *   (no tile prefetching — respects tile-usage policies)
 * - navigation requests: network-first, falling back to cache when offline
 */
const VERSION = 'ft-v1';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

const SHELL_URLS = [
  './',
  'index.html',
  'map.html',
  'manifest.webmanifest',
  'assets/style.css',
  'assets/i18n.js',
  'assets/lang-switcher.js',
  'assets/map.js',
  'assets/pwa.js',
  'assets/logo.png',
  'assets/logo-mark.png',
  'assets/lang-mark.png',
  'assets/favicon.png',
  'assets/toilet-icon.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/apple-touch-icon.png',
  '../data/cities.json',
  // map page CDN deps (versions pinned in map.html)
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
];

const TILE_HOSTS = [
  'tile.openstreetmap.fr',
  'tile.openstreetmap.org',
  'server.arcgisonline.com',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_URLS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

async function cacheFirst(req, cacheName, ignoreSearch = false) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req, { ignoreSearch });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) await cache.put(req, res.clone());
  return res;
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) await cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // page navigations: fresh when online, cached shell when offline
  if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req, SHELL));
    return;
  }

  // city GeoJSON + cities index (live outside the SW scope but same origin)
  if (url.origin === location.origin && url.pathname.includes('/data/')) {
    e.respondWith(cacheFirst(req, RUNTIME));
    return;
  }

  // CDN libs (unpkg etc.): cache-first
  if (url.origin !== location.origin && !TILE_HOSTS.includes(url.hostname)) {
    e.respondWith(cacheFirst(req, RUNTIME));
    return;
  }

  // map tiles the user actually viewed: cache-first (no prefetching)
  if (TILE_HOSTS.includes(url.hostname)) {
    e.respondWith(cacheFirst(req, RUNTIME));
    return;
  }

  // same-origin app assets (referenced with ?v=N query strings)
  if (url.origin === location.origin) {
    e.respondWith(cacheFirst(req, SHELL, true));
  }
});

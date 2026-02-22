const CACHE_NAME = 'impact-threads-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  'index.html',
  'optimized/impact_lgo-103.webp',
  'optimized/cta2-1472.webp',
  'optimized/scrollhint-936.webp',
  'sub folderconversion/START1.webp',
  'sub folderconversion/MIDDLE.webp',
  'sub folderconversion/END.webp',
  'sub folderconversion/web pcmao.webp',
  'edo.ttf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Simple cache-first for images and fonts, network-first for others
  const accept = event.request.headers.get('Accept') || '';
  if (accept.includes('image') || accept.includes('font')) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
        try { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(event.request, copy)); } catch(e){}
        return res;
      }).catch(() => cached)
    );
    return;
  }

  // For navigation and other requests, try network then fallback to cache
  event.respondWith(
    fetch(event.request).then(res => {
      try { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(event.request, copy)); } catch(e){}
      return res;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match('index.html')))
  );
});

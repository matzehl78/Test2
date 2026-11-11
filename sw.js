// Offline-Unterstützung: Netz zuerst (immer aktueller Stand), Cache als Rückfall.
const CACHE = 'spielekiste-v2';
const FILES = [
  './', 'index.html', 'css/style.css', 'icon.svg', 'manifest.webmanifest',
  'js/app.js', 'js/games/blockfall.js', 'js/games/snake.js', 'js/games/breaker.js',
  'js/games/mines.js', 'js/games/pairs.js', 'js/games/merge.js', 'js/games/connect.js',
  'js/games/sudoku.js', 'js/games/shooter.js', 'js/games/match3.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});

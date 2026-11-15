/* 小账本 · Service Worker
   策略：网络优先（拿到最新的就更新缓存），断网时用缓存 */
var CACHE = 'xiaozhangben-v11';
var ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/icons.js',
  './js/store.js',
  './js/parse.js',
  './js/ui.js',
  './js/ledger.js',
  './js/entry.js',
  './js/cat.js',
  './js/budget.js',
  './js/ai.js',
  './js/report.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(
        ASSETS.map(function (url) {
          return c.add(url).catch(function () {});
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || req.url.indexOf('http') !== 0) return;
  if (req.url.indexOf('chrome-extension') >= 0) return;

  e.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put(req, copy);
          });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
  );
});

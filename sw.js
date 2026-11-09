var CACHE_NAME = 'vocab-pwa-v1';
var CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) {
        return k !== CACHE_NAME;
      }).map(function(k) {
        return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);
  // 只处理同源 GET 请求；跨域（如 CDN、字体、发音音频）不拦截
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // 导航请求（页面跳转）优先用缓存
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(function(cached) {
        return cached || fetch(e.request).then(function(resp) {
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put('./index.html', copy); });
          return resp;
        });
      })
    );
    return;
  }

  // 静态资源：缓存优先，没有再走网络
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(resp) {
        if (resp && resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, copy); });
        }
        return resp;
      });
    })
  );
});

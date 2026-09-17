/**
 * MY TOOLS V6 — Progressive Web App Service Worker
 * Version: 2.0.0
 *
 * Single-file application:
 * index.html + manifest + icons
 */

const CACHE_NAME = 'my-tools-shell-v2';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* ================================
   INSTALL
   ================================ */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* ================================
   ACTIVATE
   ================================ */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ================================
   FETCH
   ================================ */
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Jangan intercept komunikasi Google Apps Script.
  if (
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('googleusercontent.com')
  ) {
    return;
  }

  // HTML / navigation: network first.
  if (
    request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/')
  ) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            cached => cached || caches.match('./index.html')
          )
        )
    );
    return;
  }

  // Manifest dan icon: network first agar perubahan icon/manifest
  // cepat terdeteksi setelah versi baru dipasang.
  if (
    url.pathname.endsWith('/manifest.json') ||
    url.pathname.endsWith('/icon-192.png') ||
    url.pathname.endsWith('/icon-512.png')
  ) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Asset lain: cache first, lalu ambil dari network.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

/* ================================
   MESSAGE
   ================================ */
self.addEventListener('message', event => {
  if (!event.data) return;

  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then(keys =>
        Promise.all(keys.map(key => caches.delete(key)))
      )
    );
  }
});

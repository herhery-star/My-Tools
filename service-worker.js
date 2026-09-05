/**
 * MY TOOLS V2 — Progressive Web App Service Worker
 * Force Update Version
 */

const CACHE_NAME = 'my-tools-shell-v3';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192-v3.png',
  './icon-512-v3.png'
];

/* =========================================
   INSTALL
   ========================================= */

self.addEventListener('install', (event) => {
  console.log('SW: Installing', CACHE_NAME);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        // Aktifkan SW baru segera
        return self.skipWaiting();
      })
  );
});


/* =========================================
   ACTIVATE
   ========================================= */

self.addEventListener('activate', (event) => {
  console.log('SW: Activating', CACHE_NAME);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('SW: Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
            return null;
          })
        );
      })
      .then(() => {
        // Ambil kontrol semua halaman yang sedang terbuka
        return self.clients.claim();
      })
  );
});


/* =========================================
   FETCH
   ========================================= */

self.addEventListener('fetch', (event) => {

  const request = event.request;
  const requestUrl = new URL(request.url);

  /* -----------------------------------------
     Jangan cache Google Apps Script / GAS
     ----------------------------------------- */

  if (
    requestUrl.hostname.includes('script.google.com') ||
    requestUrl.hostname.includes('googleusercontent.com')
  ) {
    event.respondWith(fetch(request));
    return;
  }


  /* -----------------------------------------
     Manifest
     Selalu prioritaskan NETWORK
     ----------------------------------------- */

  if (
    requestUrl.pathname.endsWith('/manifest.json')
  ) {
    event.respondWith(
      fetch(request, {
        cache: 'no-store'
      })
        .then((response) => {

          if (response && response.ok) {
            const responseClone = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }

          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );

    return;
  }


  /* -----------------------------------------
     Icon PWA
     Network First
     ----------------------------------------- */

  if (
    requestUrl.pathname.includes('icon-192') ||
    requestUrl.pathname.includes('icon-512')
  ) {
    event.respondWith(
      fetch(request, {
        cache: 'no-store'
      })
        .then((response) => {

          if (response && response.ok) {
            const responseClone = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }

          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );

    return;
  }


  /* -----------------------------------------
     Static assets
     Cache First + Background Update
     ----------------------------------------- */

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {

        if (cachedResponse) {

          fetch(request)
            .then((networkResponse) => {

              if (
                networkResponse &&
                networkResponse.status === 200
              ) {

                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(
                      request,
                      networkResponse.clone()
                    );
                  });

              }

            })
            .catch(() => {
              // Offline — gunakan cache
            });

          return cachedResponse;
        }

        return fetch(request);
      })
  );
});


/* =========================================
   FORCE UPDATE COMMAND
   ========================================= */

self.addEventListener('message', (event) => {

  if (!event.data) return;

  if (event.data.action === 'skipWaiting') {
    console.log('SW: Force skipWaiting');
    self.skipWaiting();
  }

});

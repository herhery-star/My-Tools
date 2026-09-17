/**
 * MY TOOLS
 * Progressive Web App Service Worker
 * Version: 1.0.0
 */

const CACHE_NAME = 'my-tools-shell-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './favicon.ico'
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

        // Aktifkan Service Worker baru segera
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

              console.log(
                'SW: Removing old cache:',
                cacheName
              );

              return caches.delete(cacheName);

            }

            return null;

          })

        );

      })

      .then(() => {

        // Ambil kontrol semua halaman
        return self.clients.claim();

      })

  );

});


/* =========================================
   FETCH
   ========================================= */

self.addEventListener('fetch', (event) => {

  const request = event.request;

  // Hanya proses request GET
  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);


  /* -----------------------------------------
     JANGAN CACHE GOOGLE APPS SCRIPT
     ----------------------------------------- */

  if (
    requestUrl.hostname.includes('script.google.com') ||
    requestUrl.hostname.includes('googleusercontent.com')
  ) {

    event.respondWith(
      fetch(request)
    );

    return;
  }


  /* -----------------------------------------
     MANIFEST
     NETWORK FIRST
     ----------------------------------------- */

  if (
    requestUrl.pathname.endsWith('/manifest.json') ||
    requestUrl.pathname.endsWith('/manifest.webmanifest')
  ) {

    event.respondWith(

      fetch(request, {
        cache: 'no-store'
      })

      .then((response) => {

        if (response && response.ok) {

          const responseClone = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {

              cache.put(
                request,
                responseClone
              );

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
     ICON PWA
     NETWORK FIRST
     ----------------------------------------- */

  if (
    requestUrl.pathname.endsWith('/icon-192.png') ||
    requestUrl.pathname.endsWith('/icon-512.png') ||
    requestUrl.pathname.endsWith('/favicon.ico')
  ) {

    event.respondWith(

      fetch(request, {
        cache: 'no-store'
      })

      .then((response) => {

        if (response && response.ok) {

          const responseClone = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {

              cache.put(
                request,
                responseClone
              );

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
     INDEX / HTML
     NETWORK FIRST
     ----------------------------------------- */

  if (
    request.mode === 'navigate' ||
    requestUrl.pathname.endsWith('.html')
  ) {

    event.respondWith(

      fetch(request, {
        cache: 'no-store'
      })

      .then((response) => {

        if (response && response.ok) {

          const responseClone = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {

              cache.put(
                request,
                responseClone
              );

            });

        }

        return response;

      })

      .catch(() => {

        return caches.match('./index.html');

      })

    );

    return;
  }


  /* -----------------------------------------
     STATIC ASSETS
     CACHE FIRST
     ----------------------------------------- */

  event.respondWith(

    caches.match(request)

      .then((cachedResponse) => {

        if (cachedResponse) {

          // Background update
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


        /* -------------------------------------
           BELUM ADA DI CACHE
           ------------------------------------- */

        return fetch(request)

          .then((networkResponse) => {

            if (
              networkResponse &&
              networkResponse.status === 200
            ) {

              const responseClone =
                networkResponse.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {

                  cache.put(
                    request,
                    responseClone
                  );

                });

            }

            return networkResponse;

          });

      })

  );

});


/* =========================================
   MESSAGE
   ========================================= */

self.addEventListener('message', (event) => {

  if (!event.data) {
    return;
  }


  /* -----------------------------------------
     FORCE UPDATE
     ----------------------------------------- */

  if (event.data.action === 'skipWaiting') {

    console.log(
      'SW: Force skipWaiting'
    );

    self.skipWaiting();

  }


  /* -----------------------------------------
     CLEAR CACHE
     ----------------------------------------- */

  if (event.data.action === 'clearCache') {

    console.log(
      'SW: Clearing cache'
    );

    event.waitUntil(

      caches.keys()
        .then((cacheNames) => {

          return Promise.all(

            cacheNames.map((cacheName) => {

              return caches.delete(cacheName);

            })

          );

        })

    );

  }

});

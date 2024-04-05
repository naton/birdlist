function main(workbox) {
  const CACHE_VERSION = 1.6;
  const {
    core: { clientsClaim, setCacheNameDetails },
    expiration: { ExpirationPlugin },
    precaching: { cleanupOutdatedCaches, precacheAndRoute },
    routing: { registerRoute },
    strategies: { StaleWhileRevalidate },
  } = workbox;

  clientsClaim();

  self.skipWaiting();

  cleanupOutdatedCaches();

  // cache name
  setCacheNameDetails({
    prefix: 'birdlist-cache',
    precache: 'precache',
    runtime: 'runtime',
  });

  // runtime cache
  // 1. stylesheet
  registerRoute(
    new RegExp('\.css$'),
    new StaleWhileRevalidate({
      cacheName: 'birdlist-cache-css',
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 7, // cache for one week
          maxEntries: 20, // only cache 20 request
          purgeOnQuotaError: true
        })
      ]
    })
  );

  // 2. images
  registerRoute(
    new RegExp('\.(png|svg|jpg|webp|avif)$'),
    new StaleWhileRevalidate({
      cacheName: 'birdlist-cache-img',
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 7, // cache for one week
          maxEntries: 20, // only cache 20 request
          purgeOnQuotaError: true
        })
      ]
    })
  );

  // 3. html
  registerRoute(
    new RegExp('\.(html)$'),
    new StaleWhileRevalidate({
      cacheName: 'birdlist-cache-html',
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 7, // cache for one week
          maxEntries: 5, // only cache 5 request
          purgeOnQuotaError: true
        })
      ]
    })
  );

  // 4. cache Dexie Cloud result
  registerRoute(
      new RegExp('https://zyh2ho4s6.dexie.cloud/'),
      new NetworkFirst({
          cacheName: 'birdlist-cache-content',
          cacheExpiration: {
              maxAgeSeconds: 60 * 2 //cache the content for 2 minutes
          }
      })
  );

  precacheAndRoute([]);
}

if (typeof importScripts === "function") {
  importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js");

  if (workbox) {
    main(workbox);
  }
}
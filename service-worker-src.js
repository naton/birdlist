importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js")

workbox.skipWaiting();
workbox.clientsClaim();

// cache name
workbox.core.setCacheNameDetails({
    prefix: 'birdlist-cache',
    precache: 'precache',
    runtime: 'runtime',
});
  
// runtime cache
// 1. stylesheet
workbox.routing.registerRoute(
    new RegExp('\.css$'),
    workbox.strategies.cacheFirst({
        cacheName: 'birdlist-cache-css',
        plugins: [
            new workbox.expiration.Plugin({
                maxAgeSeconds: 60 * 60 * 24 * 7, // cache for one week
                maxEntries: 20, // only cache 20 request
                purgeOnQuotaError: true
            })
        ]
    })
);

// 2. images
workbox.routing.registerRoute(
    new RegExp('\.(png|svg|jpg|webp|avif)$'),
    workbox.strategies.cacheFirst({
        cacheName: 'birdlist-cache-img',
        plugins: [
            new workbox.expiration.Plugin({
                maxAgeSeconds: 60 * 60 * 24 * 7,
                maxEntries: 50,
                purgeOnQuotaError: true
            })
        ]
    })
);

// 3. cache Dexie Cloud result
workbox.routing.registerRoute(
    new RegExp('https://zyh2ho4s6.dexie.cloud/'),
    workbox.strategies.staleWhileRevalidate({
        cacheName: 'birdlist-cache-content',
        cacheExpiration: {
            maxAgeSeconds: 60 * 10 //cache the content for 10 min
        }
    })
);
  
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// Push notifications
self.addEventListener('push', function(e) {
    const data = e.data.json();
    self.registration.showNotification(
        data.title,
        {
            body: data.body,
        }
    );
});

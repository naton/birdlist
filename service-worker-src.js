importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js")

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

console.log("Service worker loaded from sw.js...");

// Push notifications (via https://blog.lekoala.be/the-only-snippet-you-will-need-to-deal-with-push-notifications-in-a-service-worker)
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('This push event has no data.');
    return;
  }
  if (!self.registration) {
    console.log('Service worker does not control the page');
    return;
  }
  if (!self.registration || !self.registration.pushManager) {
    console.log('Push is not supported');
    return;
  }
  const eventText = event.data.text();
  // Specify default options
  let options = {};
  let title = '';

  // Support both plain text notification and json
  if (eventText.substr(0, 1) === '{') {
    const eventData = JSON.parse(eventText);
    title = eventData.title;

    // Set specific options
    // @link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification#parameters
    if (eventData.options) {
      options = Object.assign(options, eventData.options);
    }

    // Check expiration if specified
    if (eventData.expires && Date.now() > eventData.expires) {
      console.log('Push notification has expired');
      return;
    }
  } else {
    title = eventText;
  }
  // Warning: this can fail silently if notifications are disabled at system level
  // The promise itself resolve to undefined and is not helpful to see if it has been displayed properly
  const promiseChain = self.registration.showNotification(title, options);

  // With this, the browser will keep the service worker running until the promise you passed in has settled.
  event.waitUntil(promiseChain);
});

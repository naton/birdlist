function main(workbox) {
  const CACHE_VERSION = 1.1;
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
            maxAgeSeconds: 60 * 2 //cache the content for 2 min
        }
    })
  );

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

  precacheAndRoute(self.__WB_MANIFEST);
}

if (typeof importScripts === "function") {
  importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js");

  if (workbox) {
    main(workbox);
  }
}

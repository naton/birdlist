function main(workbox) {
  /* eslint-disable-next-line */
  const CACHE_VERSION = "2.1.9";
  const {
    core: { clientsClaim, setCacheNameDetails },
    expiration: { ExpirationPlugin },
    precaching: { cleanupOutdatedCaches, precacheAndRoute },
    routing: { setDefaultHandler, registerRoute },
    strategies: { NetworkFirst, StaleWhileRevalidate },
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

  // Use a stale-while-revalidate strategy to handle requests by default.
  setDefaultHandler(new NetworkFirst());

  // runtime cache
  // 1. stylesheet
  registerRoute(
    new RegExp('.css$'),
    new NetworkFirst({
      cacheName: 'birdlist-cache-css',
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 1, // cache for one day
          maxEntries: 30, // cache 30 request
          purgeOnQuotaError: true
        })
      ]
    })
  );

  // 2. images
  registerRoute(
    new RegExp('.(png|svg|jpg|webp|avif)$'),
    new StaleWhileRevalidate({
      cacheName: 'birdlist-cache-img',
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 7, // cache for one week
          maxEntries: 20, // cache 20 request
          purgeOnQuotaError: true
        })
      ]
    })
  );

  // 3. html
  registerRoute(
    new RegExp('.(html)$'),
    new NetworkFirst({
      cacheName: 'birdlist-cache-html',
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 7, // cache for one week
          maxEntries: 10, // cache 10 request
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
          maxAgeSeconds: 60 * 2 // cache the content for 2 minutes
      }
    })
  );

  function isClientFocused() {
    /* eslint-disable-next-line */
    return clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        let clientIsFocused = false;
  
        for (let i = 0; i < windowClients.length; i++) {
          const windowClient = windowClients[i];
          if (windowClient.focused) {
            clientIsFocused = true;
            break;
          }
        }
  
        return clientIsFocused;
      });
  }

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

    const promiseChain = isClientFocused().then((clientIsFocused) => {
      if (!clientIsFocused) {
        // No focused window, we need to show a notification.
        return self.registration.showNotification(title, options);
      }
    });

    // With this, the browser will keep the service worker running until the promise you passed in has settled.
    event.waitUntil(promiseChain);
  });

  self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(
      /* eslint-disable-next-line */
      clients
        .matchAll({
          type: "window",
        })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url === "/" && "focus" in client) return client.focus();
          }
          /* eslint-disable-next-line */
          if (clients.openWindow) return clients.openWindow("/lists/" + event.notification.data.listId);
        })
    );

    /* eslint-disable-next-line */
    clients.openWindow("/lists/" + event.notification.data.listId);
  });

  /* eslint-disable-next-line */
  precacheAndRoute(self.__WB_MANIFEST);
}

if (typeof importScripts === "function") {
  /* eslint-disable-next-line */
  importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js");

  /* eslint-disable-next-line */
  if (workbox) {
      /* eslint-disable-next-line */
      main(workbox);
  }
}

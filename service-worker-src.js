function main(workbox) {
  // Manual cache namespace bump.
  // Increase this when you want to force a hard runtime cache reset.
  const CACHE_VERSION = "2026.04.05.2";
  const CACHE_PREFIX = `birdlist-cache-v${CACHE_VERSION}`;
  const CSS_CACHE = `${CACHE_PREFIX}-css`;
  const IMG_CACHE = `${CACHE_PREFIX}-img`;
  const HTML_CACHE = `${CACHE_PREFIX}-html`;
  const CONTENT_CACHE = `${CACHE_PREFIX}-content`;

  const {
    core: { clientsClaim, setCacheNameDetails },
    expiration: { ExpirationPlugin },
    precaching: { cleanupOutdatedCaches, precacheAndRoute },
    routing: { registerRoute },
    strategies: { NetworkFirst, StaleWhileRevalidate },
  } = workbox;

  clientsClaim();

  self.skipWaiting();

  cleanupOutdatedCaches();

  // cache name
  setCacheNameDetails({
    prefix: CACHE_PREFIX,
    precache: 'precache',
    runtime: 'runtime',
  });

  // Runtime cache
  // 1. Stylesheets
  registerRoute(
    ({ request }) => request.destination === "style",
    new NetworkFirst({
      cacheName: CSS_CACHE,
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 1, // cache for one day
          maxEntries: 30, // cache 30 request
          purgeOnQuotaError: true
        })
      ]
    })
  );

  // 2. Images
  registerRoute(
    ({ request }) => request.destination === "image",
    new StaleWhileRevalidate({
      cacheName: IMG_CACHE,
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 7, // cache for one week
          maxEntries: 80, // cache 80 requests
          purgeOnQuotaError: true
        })
      ]
    })
  );

  // 3. Documents / navigation HTML
  registerRoute(
    ({ request }) => request.destination === "document",
    new NetworkFirst({
      cacheName: HTML_CACHE,
      networkTimeoutSeconds: 4,
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 7, // cache for one week
          maxEntries: 10, // cache 10 request
          purgeOnQuotaError: true
        })
      ]
    })
  );

  // 4. Dexie Cloud API responses
  registerRoute(
    ({ url }) => url.origin === "https://zyh2ho4s6.dexie.cloud",
    new NetworkFirst({
      cacheName: CONTENT_CACHE,
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 60 * 2, // cache for 2 minutes
          maxEntries: 80,
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  self.addEventListener("activate", (event) => {
    const allowedCaches = [CSS_CACHE, IMG_CACHE, HTML_CACHE, CONTENT_CACHE];
    event.waitUntil(
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith("birdlist-cache-v") && !allowedCaches.includes(cacheName)) {
              return caches.delete(cacheName);
            }
            return Promise.resolve(false);
          })
        )
      )
    );
  });

  function isClientFocused() {
    return self.clients
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
    const eventText = event.data.text().trim();

    let payload = null;
    if (eventText.startsWith('{')) {
      try {
        payload = JSON.parse(eventText);
      } catch (error) {
        console.log('Push payload JSON parse failed', error);
      }
    }

    // Specify defaults
    let title = 'Birdlist';
    let options = {};

    if (payload) {
      title = payload.title || title;
      options = payload.options && typeof payload.options === 'object' ? payload.options : {};

      // Skip expired notifications
      if (payload.expires && Date.now() > payload.expires) {
        console.log('Push notification has expired');
        return;
      }
    } else if (eventText) {
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
    const listId = event.notification?.data?.listId;
    const listPath = listId ? "lists/" + encodeURIComponent(listId) : "lists";
    const targetUrl = new URL(listPath, self.registration.scope).href;

    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.startsWith(self.location.origin) && "focus" in client) {
              if ("navigate" in client) {
                client.navigate(targetUrl);
              }
              return client.focus();
            }
          }
          if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
        })
    );
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

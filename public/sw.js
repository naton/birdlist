function main(workbox) {
  /* eslint-disable-next-line */
  const CACHE_VERSION = "2.0";
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
    prefix: 'birdlist-cache',
    precache: 'precache',
    runtime: 'runtime',
  });

  // runtime cache
  // 1. stylesheet
  registerRoute(
    new RegExp('.css$'),
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
    new RegExp('.(png|svg|jpg|webp|avif)$'),
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
    new RegExp('.(html)$'),
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
          if (clients.openWindow) return clients.openWindow("/");
        })
    );

    /* eslint-disable-next-line */
    clients.openWindow("/lists/" + event.notification.data.listId);
  });

  /* eslint-disable-next-line */
  precacheAndRoute([{"revision":"4e10c1d8caec3f1ee79f0f74b8e3733f","url":"index.html"},{"revision":"d5a8186c0779cc1fe5f0b56f6206348a","url":"10.2__iPad_portrait.png"},{"revision":"b97b32d396a1ba24deaeee1fb027b995","url":"10.5__iPad_Air_portrait.png"},{"revision":"9ac5824e873cafb4b88d9db9f06f4d0d","url":"10.9__iPad_Air_portrait.png"},{"revision":"07319d9c86c354468e55a6223f843b8a","url":"11__iPad_Pro__10.5__iPad_Pro_portrait.png"},{"revision":"3742f176d7df049c4f4caf11fa14cdd1","url":"12.9__iPad_Pro_portrait.png"},{"revision":"b01fbbf2abb4d1ef88052645b7fdb8d4","url":"180x180.png"},{"revision":"d2cc07950f6cede77eccd5f9cd16c8f3","url":"192x192.png"},{"revision":"2ef18f5199a76395022ef92910b9b0d5","url":"384x384.png"},{"revision":"a05f4b318e1ed483f43026c3258faaeb","url":"4__iPhone_SE__iPod_touch_5th_generation_and_later_portrait.png"},{"revision":"0a19f2247866e9d5b1bb1dc0594f1bfe","url":"512x512.png"},{"revision":"aab01a34ad5d47f2f64936e8fc1984ee","url":"8.3__iPad_Mini_portrait.png"},{"revision":"e1a2b32acd2996ed74e603dcd2d3cb0f","url":"9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_portrait.png"},{"revision":"9532a45dcf6f3931d257502543fd6475","url":"96x96.png"},{"revision":"4560ec3a461c0375933cd9eec67a41c2","url":"assets/AboutView-7ATECbSo.css"},{"revision":"0b654e891a3758ec6cf594044a6fae06","url":"assets/AboutView-ByrdXgIS.js"},{"revision":"10180fc152c20bfbee4f02026fa0a42e","url":"assets/birds_en-DN0Dm19r.js"},{"revision":"2070495a9dd2ca6d139c44fc5260e9ab","url":"assets/birds_sv-DeI3N9Kg.js"},{"revision":"055d7422b73fdac318d84636126adf3e","url":"assets/BirdstreakList-B-nw8zt3.js"},{"revision":"43881d0d5f9cc43cea1e4882161881bd","url":"assets/BirdstreakList-CFasBVpV.css"},{"revision":"0dda5d0ac6b7f0a37a2cb18fc18e78cb","url":"assets/index-D9_CIidO.js"},{"revision":"728c4e438c772010c48df6671a86dd58","url":"assets/index-uqf8QpJc.css"},{"revision":"3dea083b14a5b4d4a511428d83314ecf","url":"assets/ListsView-BUqvMjsJ.css"},{"revision":"4a8a43b911a3472e009b666018408bc6","url":"assets/ListsView-C4M6qR6k.js"},{"revision":"7995a76d33480394d81e99e93ed97cfb","url":"assets/SingleList-DBbEU0OX.js"},{"revision":"92e0d02236bd4e2546bff181258959a1","url":"assets/SingleList-Dqay8Ei-.css"},{"revision":"afb5f8c6d32770d556e3417ae861ca56","url":"assets/StreakIcon-D6df_EUP.js"},{"revision":"e4bb4cd27a62f675d334b87300fa2a09","url":"assets/texts_en-ClfHAoeX.js"},{"revision":"f1d99b3000702bd7efc4f04a1234fcd9","url":"assets/texts_sv-D_rYHiLc.js"},{"revision":"6478a7f3e3ed55a7c3328663f30df967","url":"assets/three.module-BOtL1hTA.js"},{"revision":"1f15128082beb6d803ef81e7db4ac601","url":"assets/vanta.birds.min-tSBK_t4N.js"},{"revision":"26c8b5def325d75522957a73e246d74b","url":"assets/YearlyList-jqAqATq7.js"},{"revision":"e4e40b0c82d228add33b5bcfe276a859","url":"browserconfig.xml"},{"revision":"2163523c674ea2ae0149a7be7daba916","url":"favicon-16x16.png"},{"revision":"6e10c15e1db1073658e0e37623e75b43","url":"favicon-32x32.png"},{"revision":"d9e5655f89dcb494e15442a9f07d17d9","url":"favicon.ico"},{"revision":"8d425e9b439b746205f12d78705097d4","url":"iPhone_11__iPhone_XR_portrait.png"},{"revision":"96590ab2d4cc9f68446984c5c867dbee","url":"iPhone_11_Pro_Max__iPhone_XS_Max_portrait.png"},{"revision":"f695c01da4dbe0fdf2e00e5d9ee24535","url":"iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_portrait.png"},{"revision":"504a501a35c452fa9aff64f62c9e57ac","url":"iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_portrait.png"},{"revision":"4a0d7143ed182ee6717b55fe108440cf","url":"iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait.png"},{"revision":"0f428d28351a46d52f46fc50f8d85aab","url":"iPhone_14_Pro_Max_portrait.png"},{"revision":"da2d1f5cf7f3014f14edecabefe03635","url":"iPhone_14_Pro_portrait.png"},{"revision":"6e74338feba8308ffffeba6026986988","url":"iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_portrait.png"},{"revision":"3347aa9e738c47ccbf3094a5b64e71e7","url":"iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_portrait.png"},{"revision":"b3f582c0ad11784cb6dbbd54664f0bf3","url":"logo.png"},{"revision":"25c69d6486d4313268a41943c1a024af","url":"logo.webp"},{"revision":"0b1fde0cf8587451b623d226f06ecc3b","url":"safari-pinned-tab.svg"},{"revision":"c9672a67f857d9705c92aa47b7b56661","url":"site.webmanifest"},{"revision":"f7c787d4bfebfbfcb8ac53ff0fa81093","url":"x.svg"}]);
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

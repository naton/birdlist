import { createApp } from "vue";
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from "./App.vue";
import router, { routePrefetchLoaders } from "./router";
import { scheduleRoutePrefetch } from "./router/prefetch";
import "./assets/main.css";

if (typeof window !== "undefined" && !("anchorName" in document.documentElement.style)) {
  import("@oddbird/css-anchor-positioning").catch((error) => {
    console.error("Failed to load CSS anchor positioning polyfill.", error);
  });
}

if (typeof window !== "undefined" && typeof HTMLElement.prototype.showPopover !== "function") {
  import("@oddbird/popover-polyfill").catch((error) => {
    console.error("Failed to load popover polyfill.", error);
  });
}

const app = createApp(App);
const pinia = createPinia();

pinia.use(piniaPluginPersistedstate)
app.use(pinia);
app.use(router);

app.mount("#app");

router.isReady().then(() => {
  scheduleRoutePrefetch(routePrefetchLoaders);
});

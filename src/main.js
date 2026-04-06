import { createApp } from "vue";
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from "./App.vue";
import router from "./router";
import "./assets/main.css";

if (typeof window !== "undefined" && !("anchorName" in document.documentElement.style)) {
  import("@oddbird/css-anchor-positioning").catch((error) => {
    console.error("Failed to load CSS anchor positioning polyfill.", error);
  });
}

const app = createApp(App);
const pinia = createPinia();

pinia.use(piniaPluginPersistedstate)
app.use(pinia);
app.use(router);

app.mount("#app");

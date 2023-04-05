<script setup>
import { RouterLink, RouterView } from "vue-router";

function onUpdateFound(registration) {
  const newWorker = registration.installing;

  newWorker.addEventListener('statechange', async () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      document.location.reload(true);
    }
  });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("dist/sw.js").then(registration => {
    console.log("Service worker running…")
    registration.addEventListener('updatefound', () => onUpdateFound(registration));
  });
}
</script>

<template>
  <main class="main">
    <router-view />
  </main>
  <nav class="nav">
    <router-link class="nav-link" to="/">Birdlist</router-link>
    <router-link class="nav-link" to="/about">Om</router-link>
  </nav>
</template>

<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <main class="main">
    <router-view />
  </main>
  <nav class="nav">
    <router-link class="nav-link" to="/home">Birdlist</router-link>
    <router-link class="nav-link" to="/about">Om</router-link>
  </nav>
</template>

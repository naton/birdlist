<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <main class="main">
    <router-view />
  </main>
  <nav class="nav">
    <router-link to="/">Hem</router-link>
    <router-link to="/about">Om</router-link>
  </nav>
</template>

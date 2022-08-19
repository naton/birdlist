<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <main class="main">
    <RouterView />
  </main>
  <nav class="nav">
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
  </nav>
</template>

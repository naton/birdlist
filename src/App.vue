<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <main class="main">
    <router-view />
  </main>
  <nav class="nav">
    <router-link to="/">Home</router-link>
    <router-link to="/about">About</router-link>
  </nav>
</template>

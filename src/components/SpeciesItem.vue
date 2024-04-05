<script setup>
import UserInitial from "./icons/UserInitial.vue";

defineProps(["obs", "bird"]);
</script>

<template>
  <li>
    <span class="obs">
      <span class="name">✘ {{ obs[0].name }}</span>
      <span class="seen-by">
        <user-initial v-for="user in [...new Set(obs.map((o) => o.owner))]" :key="user" :user="user" />
      </span>
    </span>
  </li>
</template>

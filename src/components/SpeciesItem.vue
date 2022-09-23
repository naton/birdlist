<script setup>
import UserIcon from "./UserIcon.vue";

defineProps(["obs", "bird"]);
</script>

<template>
  <li>
    <span class="obs">
      <span class="name">✘ {{ obs[0].name }}</span>
      <span class="seen-by">
        <user-icon
          v-for="user in [...new Set(obs.map((o) => o.owner))]"
          :key="user"
          :user="user"
        ></user-icon>
      </span>
    </span>
  </li>
</template>

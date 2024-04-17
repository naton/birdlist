<script setup>
import UserInitial from "./icons/UserInitial.vue";

const props = defineProps(["obs"]);
</script>

<template>
  <li>
    <span class="obs">
      <span class="name">{{ obs[0].name }}</span>
      <span v-if="props.obs.owner && props.obs.owner !== 'unauthorized'" class="seen-by">
        <user-initial v-for="user in [...new Set(obs.map((o) => o.owner))]" :key="user" :user="user" />
        </span>
    </span>
  </li>
</template>

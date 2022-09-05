<script setup>
defineProps(["bird"]);
</script>

<template>
  <li>
    <span class="obs">
      <span class="name">✔️ {{ bird }}</span>
    </span>
  </li>
</template>

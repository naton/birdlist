<script setup>
defineProps(["open", "observation"]);
</script>

<template>
  <dialog :open="open">{{ observation }}</dialog>
</template>

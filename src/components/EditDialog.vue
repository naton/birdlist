<script setup>
defineProps(["open", "observation"]);
</script>

<template>
  <dialog :open="open">{{ observation }}</dialog>
</template>

<style scoped>
div {
  margin-top: 1rem;
}

label {
  margin-top: 1rem;
}

input {
  max-width: 90%;
  font-size: 1.5rem;
}
</style>

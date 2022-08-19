<script setup>
const emit = defineEmits(["change"]);
</script>

<template>
  <div id="addbird">
    <input
      type="text"
      list="birds"
      @change="emit('add', $event)"
      autocomplete="off"
      placeholder="Enter bird name…"
    />
  </div>
</template>

<style scoped>
input {
  width: calc(100% - 2rem);
  margin: 0 1rem;
  padding: 0.3em;
  border: 1px solid var(--color-border);
  box-sizing: border-box;
  font-size: 1.2rem;
}

input::placeholder {
  color: var(--color-text);
}
</style>

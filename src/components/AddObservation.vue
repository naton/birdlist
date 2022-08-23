<script setup>
const emit = defineEmits(["add"]);
</script>

<template>
  <div class="add">
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
.add {
  padding: 1rem;
}

input {
  width: 100%;
  padding: 0.3em;
  border: 1px solid var(--color-border);
  box-sizing: border-box;
  background: none;
  font-size: 1.2rem;
  appearance: none;
}

input::placeholder {
  color: var(--color-text);
}
</style>

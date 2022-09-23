<script setup>
const props = defineProps(["list"]);
const emit = defineEmits(["add"]);
</script>

<template>
  <div class="add">
    <input
      name="bird"
      type="text"
      list="birds"
      @change="emit('add', $event, props.list)"
      autocomplete="off"
      placeholder="Skriv namnet på fågeln du sett…"
    />
  </div>
</template>

<style scoped>
.add {
  padding: 1rem 1rem 0.5rem;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-sizing: border-box;
  color: var(--color-text);
  background: none;
  font-size: 1.2rem;
  appearance: none;
}

input::placeholder {
  color: var(--color-text-dim);
}
</style>

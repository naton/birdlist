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
    />
  </div>
</template>

<style>
#addbird input {
  width: calc(100% - 2rem);
  margin: 0 1rem;
  padding: 0.3em;
  box-sizing: border-box;
  font-size: 1.2rem;
}
</style>

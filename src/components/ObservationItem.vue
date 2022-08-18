<script setup>
const emit = defineEmits(["click"]);
defineProps(["item"]);
</script>

<template>
  <li tabindex="0">
    {{ item.name || item }}
    <button
      type="button"
      @click.prevent="emit('delete', item.id)"
      v-if="$attrs.onDelete"
    >
      x
    </button>
  </li>
</template>

<style>
li button {
  display: none;
}

li:focus button {
  display: inline-block;
}
</style>

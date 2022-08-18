<script setup>
const emit = defineEmits(["click"]);
defineProps(["item"]);
</script>

<template>
  <li>
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

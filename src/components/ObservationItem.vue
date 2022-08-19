<script setup>
import { ref } from "vue";

const emit = defineEmits(["click"]);
defineProps(["item", "show_date"]);

const showDeleteButton = ref(false);
</script>

<template>
  <li
    @click="showDeleteButton = !showDeleteButton"
    :class="showDeleteButton && 'is-active'"
  >
    {{ item.name || item }}
    <span v-if="show_date">{{ item.date }}</span>
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

li.is-active button {
  display: inline-block;
}
</style>

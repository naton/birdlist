<script setup>
import { ref } from "vue";

const emit = defineEmits(["click"]);
defineProps(["item", "show_date"]);

const showDeleteButton = ref(false);

const formatDate = (date) =>
  new Intl.DateTimeFormat({
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
</script>

<template>
  <li
    @click="showDeleteButton = !showDeleteButton"
    :class="showDeleteButton && 'is-active'"
  >
    {{ item.name || item }}
    <span v-if="show_date">{{ formatDate(item.date) }}</span>
    <button
      type="button"
      @click.prevent="emit('delete', item.id)"
      v-if="$attrs.onDelete"
    >
      x
    </button>
  </li>
</template>

<style scoped>
li {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 1em;
  overflow: hidden;
}

li button {
  position: absolute;
  right: 0;
  transform: translateX(3rem);
  width: 3rem;
  height: 100%;
  margin-top: -0.6rem;
  border: none;
  color: var(--color-background-dim);
  background: var(--color-border);
  transition: 0.1s transform ease-out;
}

li.is-active {
  position: relative;
  background: var(--color-background-dim);
}

li.is-active button {
  transform: translateX(0rem);
  z-index: 1;
}
</style>

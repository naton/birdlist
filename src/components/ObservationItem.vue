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
    <span class="obs">
      <span class="date" v-if="show_date">{{ formatDate(item.date) }}</span>
      <span class="name">✔️ {{ item.name || item }}</span>
    </span>
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
  overflow: hidden;
}

.obs {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 1em;
  background: var(--color-background);
  transition: 0.1s transform ease-out;
  text-align: left;
}

.date {
  margin-right: 1em;
}
.name {
  margin-right: auto;
}

button {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  z-index: -1;
  transform: translateX(3rem);
  transition: 0.1s transform ease-out;
}

.is-active {
  position: relative;
}

.is-active .obs {
  background: var(--color-background-dim);
  transform: translateX(-3rem);
}

.is-active button {
  transform: translateX(0);
  z-index: 0;
}
</style>

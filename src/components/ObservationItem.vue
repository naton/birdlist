<script setup>
const emit = defineEmits(["delete", "select"]);
const props = defineProps(["item", "show_date", "selected_id"]);

function formatDate(date) {
  new Intl.DateTimeFormat(false, {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
}

function emitSelect(id) {
  emit("select", id);
}
</script>

<template>
  <li
    @click.prevent="emitSelect(item.id)"
    :class="
      props.selected_id == (typeof item === 'object' && item.id) && 'is-active'
    "
  >
    <span class="obs">
      <span class="name">✔️ {{ item.name || item }}</span>
      <span class="date" v-if="show_date">{{ formatDate(item.date) }}</span>
    </span>
    <button type="button" @click.prevent="emit('delete', item.id)">x</button>
  </li>
</template>

<style scoped>
li {
  overflow: hidden;
}

li:first-child {
  border-top: 1px solid var(--color-background-dim);
}

.obs {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 1em;
  border-bottom: 1px solid var(--color-background-dim);
  background: var(--color-background);
  transition: 0.1s transform ease-out;
  text-align: left;
}

.date {
  margin-right: 1em;
  color: var(--color-text-dim);
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

.is-active .date {
  color: var(--color-text);
}

.is-active button {
  transform: translateX(0);
  z-index: 0;
}
</style>

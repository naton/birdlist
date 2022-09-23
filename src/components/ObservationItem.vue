<script setup>
import UserIcon from "./UserIcon.vue";

const props = defineProps(["obs", "show_date", "selected", "user"]);
const emit = defineEmits(["select", "edit"]);

function formatDate(date) {
  return new Intl.DateTimeFormat(false, {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
}

function canEdit(owner) {
  return props.user !== "Unauthorized" && props.user === owner;
}
</script>

<template>
  <li
    @click="emit('select', obs)"
    :class="selected.id == obs.id && 'is-active'"
  >
    <span class="obs">
      <span class="name">✘ {{ obs.name }}</span>
      <span class="date" v-if="show_date">{{ formatDate(obs.date) }}</span>
      <span class="seen-by">
        <user-icon :user="obs.owner"></user-icon>
      </span>
    </span>
    <button
      type="button"
      class="edit-button"
      @click.stop="emit('edit', obs)"
      :disabled="!canEdit(obs.owner)"
    >
      ✎
    </button>
  </li>
</template>

<style scoped>
.edit-button {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  outline: 1px solid;
  z-index: -1;
  transform: translateX(3.1rem);
  transition: 0.1s transform ease-out;
}

.edit-button:disabled {
  opacity: 0.7;
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

.is-active .edit-button {
  transform: translateX(-0.1rem);
  z-index: 0;
}
</style>

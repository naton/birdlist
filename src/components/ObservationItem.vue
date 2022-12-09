<script setup>
import UserIcon from "./UserIcon.vue";

const props = defineProps(["obs", "selected", "user"]);
const emit = defineEmits(["select", "edit"]);

function formatDate(date) {
  return new Intl.DateTimeFormat(false, {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
}

function canEdit(owner) {
  return props.user !== "unauthorized" && props.user === owner;
}
</script>

<template>
  <li @click="emit('select', obs)" :class="selected.id == obs.id && 'is-active'">
    <span class="obs">
      <span class="name">✘ {{ obs.name }}</span>

      <svg
        v-if="obs.location"
        class="has-location"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="24px"
        height="16px"
        title="Plats angiven"
      >
        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 15.5s-5.5-5-5.5-9.5a5.5 5.5 0 0 1 11 0 6.883 6.883 0 0 1-.322 2" />
          <circle cx="8" cy="6" r="1.5" />
          <path d="m8.5 11.5 2 2 4-4" />
        </g>
      </svg>
      <span class="date">{{ formatDate(obs.date) }}</span>
      <span class="seen-by">
        <user-icon :user="obs.owner"></user-icon>
      </span>
    </span>
    <button type="button" class="edit-button" @click.stop="emit('edit', obs)">
      <span v-if="canEdit(obs.owner)">✏️</span>
      <span v-else>👁</span>
    </button>
  </li>
</template>

<style>
.obs + .edit-button {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  outline: 1px solid;
  z-index: -1;
  transform: translateX(3.1rem);
  transition: 0.1s transform ease-out;
}

li.is-active {
  position: relative;
}

li.is-active .obs {
  background: var(--color-background-dim);
  transform: translateX(-3rem);
}

li.is-active .date {
  color: var(--color-text);
}

li.is-active .edit-button {
  transform: translateX(-0.1rem);
  z-index: 0;
}

.obs .has-location {
  align-self: center;
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
}
</style>

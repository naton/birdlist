<script setup>
import UserIcon from "./icons/UserIcon.vue";
import LocationSpecifiedIcon from "./icons/LocationSpecifiedIcon.vue";
import { formatDate } from "@/helpers";

const props = defineProps(["obs", "user"]);
const emit = defineEmits(["select", "edit"]);

function canEdit(owner) {
  return owner === "unauthorized" || props.user === owner;
}
</script>

<template>
  <li @click="emit('select', obs)" tabindex="-1">
    <span class="obs">
      <span class="name">✘ {{ obs.name }}</span>

      <location-specified-icon v-if="obs.location"></location-specified-icon>
      <span class="date">{{ formatDate(obs.date) }}</span>
      <span class="seen-by">
        <user-icon :user="obs.owner"></user-icon>
      </span>
    </span>
    <button type="button" class="edit-button" @click="emit('edit', obs)">
      <span v-if="canEdit(obs.owner)">✏️</span>
      <span v-else>👁</span>
    </button>
  </li>
</template>

<style>
.obs + .edit-button {
  margin-left: -3rem;
  transform: translateX(3.1rem);
  transition: 0.1s transform ease-out;
  cursor: pointer;
}

.list li:focus,
.list li:focus-within {
  background: var(--color-background-dim);
}

.list li:focus .obs,
.list li:focus-within .obs {
  transform: translateX(-3rem);
}

.list li:focus .date {
  color: var(--color-text);
}

.list li:focus .edit-button,
.list li:focus-within .edit-button {
  position: relative;
  transform: translateX(0rem);
  z-index: 1;
}

.obs .has-location {
  align-self: center;
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
}
</style>

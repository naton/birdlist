<script setup>
import UserInitial from "./icons/UserInitial.vue";
import LocationSpecifiedIcon from "./icons/LocationSpecifiedIcon.vue";
import { formatDate } from "@/helpers";

const props = defineProps(["obs", "user", "selected"]);
const emit = defineEmits(["edit"]);

function canEdit(owner) {
  return owner === "unauthorized" || props.user === owner;
}

function editObservation() {
  emit("edit", props.obs);
}
</script>

<template>
  <li tabindex="-1" :class="props.selected && 'selected'">
    <span class="obs">
      <span class="name">✘ {{ props.obs.name }}</span>

      <location-specified-icon v-if="props.obs.location" />
      <span class="date">{{ formatDate(props.obs.date) }}</span>
      <span class="seen-by">
        <user-initial :user="props.obs.owner" />
      </span>
    </span>
    <button type="button" class="edit-button" @click.stop="editObservation">
      <span v-if="canEdit(props.obs.owner)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><title>Edit</title><path fill="currentColor" d="M8.1 3.5.3 11.3c-.2.2-.3.4-.3.7v3c0 .6.4 1 1 1h3c.3 0 .5-.1.7-.3l7.8-7.8-4.4-4.4zm7.6-.2-3-3c-.4-.4-1-.4-1.4 0L9.5 2.1l4.4 4.4 1.8-1.8c.4-.4.4-1 0-1.4z"/></svg></span>
      <span v-else><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><title>View</title><path fill="currentColor" d="M8 14c3.6 0 6.4-3.1 7.6-4.9.5-.7.5-1.6 0-2.3C14.4 5.1 11.6 2 8 2 4.4 2 1.6 5.1.4 6.9c-.5.7-.5 1.6 0 2.2C1.6 10.9 4.4 14 8 14zm0-9c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3z"/></svg></span>
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

.list li.selected {
  background: var(--color-background-dim);
}

.list li.selected .obs {
  transform: translateX(-3rem);
}

.list li.selected .date {
  color: var(--color-text);
}

.list li.selected .edit-button {
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

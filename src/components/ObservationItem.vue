<script setup>
import UserInitial from "./icons/UserInitial.vue";
import LocationSpecifiedIcon from "./icons/LocationSpecifiedIcon.vue";
import EditIcon from "./icons/EditIcon.vue";
import ViewIcon from "./icons/ViewIcon.vue";
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
      <span class="name">{{ props.obs.name }}</span>
      <location-specified-icon v-if="props.obs.location" />
      <span class="date">{{ formatDate(props.obs.date) }}</span>
      <span class="seen-by">
        <user-initial :user="props.obs.owner" />
      </span>
    </span>
    <button type="button" class="edit-button" @click.stop="editObservation">
      <span v-if="canEdit(props.obs.owner)"><edit-icon /></span>
      <span v-else><view-icon /></span>
    </button>
  </li>
</template>

<style>
.obs + .edit-button {
  margin-left: -3rem;
  transform: translateX(3rem);
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
  transform: translateX(-0.25rem);
  z-index: 1;
}

.obs .has-location {
  align-self: center;
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
}
</style>

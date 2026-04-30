<script setup>
import { computed } from "vue";
import UserInitial from "./icons/UserInitial.vue";
import LocationSpecifiedIcon from "./icons/LocationSpecifiedIcon.vue";
import { formatDate } from "@/helpers";
import { useListItemViewModel } from "./useListItemViewModel.js";

const selected = defineModel();

const props = defineProps({
  obs: {
    type: [Object, Array],
    required: true,
  },
  mode: {
    type: String,
    default: "observation",
    validator: (value) => ["observation", "species"].includes(value),
  },
});

const emit = defineEmits(["edit"]);
const {
  isSpeciesMode,
  selectedObservation,
  uniqueOwners,
  birdLabel,
  getOwnerLabel,
} = useListItemViewModel(props);
const isSelected = computed(() => selected.value === props.obs);

function handleClick() {
  if (!selectedObservation.value) {
    return;
  }

  selected.value = selectedObservation.value;
  emit("edit", selectedObservation.value);
}
</script>

<template>
  <li tabindex="-1" :class="isSelected && 'selected'" @click="handleClick()">
    <span v-if="!isSpeciesMode" class="content-wrapper obs">
      <span class="name">{{ birdLabel }}</span>
      <location-specified-icon v-if="props.obs.location" />
      <span class="date">{{ formatDate(props.obs.date) }}</span>
      <span v-if="props.obs.owner && props.obs.owner !== 'unauthorized'" class="seen-by">
        <user-initial :user="props.obs.owner" :initial-label="getOwnerLabel(props.obs.owner)" :color-key="props.obs.owner" />
      </span>
    </span>

    <span v-else class="content-wrapper obs">
      <span class="name">{{ birdLabel }}</span>
      <span class="date" v-if="selectedObservation">{{ formatDate(selectedObservation.date) }}</span>
      <span v-if="uniqueOwners.length" class="seen-by">
        <user-initial v-for="user in uniqueOwners" :key="user" :user="user" :initial-label="getOwnerLabel(user)" :color-key="user" />
      </span>
    </span>
  </li>
</template>

<style>
.list li {
  display: flex;
  justify-content: space-between;
  padding: 0;
  position: relative;
  overflow: hidden;
}

.content-wrapper {
  display: flex;
  align-items: center;
  transition: 0.1s transform ease-out;
  flex: 1;
}

.bird-info .name {
  padding-left: 0.5rem;
  background: none;
}

.check-button {
  padding: 0;
  background: none;
  cursor: pointer;
}

.list li.selected {
  background: var(--color-background-dim);
  outline: none;
}

.list li.selected .date {
  color: var(--color-text);
}

.obs .has-location {
  align-self: center;
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
}

.remove-button {
  z-index: 1;
}
</style>

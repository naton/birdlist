<script setup>
import UserInitial from "./icons/UserInitial.vue";
import LocationSpecifiedIcon from "./icons/LocationSpecifiedIcon.vue";
import { formatDate, toPublicUserLabel } from "@/helpers";

const selected = defineModel();

const props = defineProps({
  // Common props
  
  // Observation specific props
  obs: Object,
  user: String,
  
  // Determines the mode of the component
  mode: {
    type: String,
    default: "observation", // "observation" or "species"
    validator: (value) => ["observation", "species"].includes(value)
  }
});

const emit = defineEmits(["edit"]);

function handleClick() {
  if (props.mode === "observation") {
    // Set the selected observation and emit edit
    selected.value = props.obs;
    emit("edit", props.obs);
  } else if (props.mode === "species") {
    // For species mode, get the last observation
    const lastObservation = props.obs[props.obs.length - 1];
    selected.value = lastObservation;
    emit("edit", lastObservation);
  }
}

function getOwnerLabel(owner) {
  return toPublicUserLabel(owner);
}
</script>

<template>
  <li tabindex="-1" :class="selected === props.obs && 'selected'" @click="handleClick()">
    <!-- Observation Mode Content -->
    <span v-if="props.mode === 'observation'" class="content-wrapper obs">
      <span class="name">{{ props.obs.name }}</span>
      <location-specified-icon v-if="props.obs.location" />
      <span class="date">{{ formatDate(props.obs.date) }}</span>
      <span v-if="props.obs.owner && props.obs.owner !== 'unauthorized'" class="seen-by">
        <user-initial :user="props.obs.owner" :initial-label="getOwnerLabel(props.obs.owner)" :color-key="props.obs.owner" />
      </span>
    </span>
    
    <!-- Species Mode Content -->
    <span v-else class="content-wrapper obs">
      <span class="name">{{ props.obs[0].name }}</span>
      <span class="date" v-if="props.obs.length > 0">{{ formatDate(props.obs[props.obs.length - 1].date) }}</span>
      <span v-if="props.obs.length > 0" class="seen-by">
        <user-initial v-for="user in [...new Set(props.obs.map((o) => o.owner))]" :key="user" :user="user" :initial-label="getOwnerLabel(user)" :color-key="user" />
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

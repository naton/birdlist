<script setup>
import UserInitial from "./icons/UserInitial.vue";
import LocationSpecifiedIcon from "./icons/LocationSpecifiedIcon.vue";
import EditIcon from "./icons/EditIcon.vue";
import ViewIcon from "./icons/ViewIcon.vue";
import { formatDate } from "@/helpers";

const props = defineProps({
  // Common props
  selected: Boolean,
  
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

const emit = defineEmits(["edit", "click"]);

function canEdit(owner) {
  return owner === "unauthorized" || props.user === owner;
}

function handleEdit() {
  if (props.mode === "observation") {
    emit("edit", props.obs);
  } else if (props.mode === "species") {
    // For species mode, edit the last observation for this bird
    const lastObservation = props.obs[props.obs.length - 1];
    emit("edit", lastObservation);
  }
}

function handleClick() {
  if (props.mode === "observation") {
    // For observation mode, we want to emit a click event that the parent can use
    // to toggle selection state
    emit("click", props.obs);
  } else if (props.mode === "species") {
    // For species mode, we also emit click but with the last observation
    const lastObservation = props.obs[props.obs.length - 1];
    emit("click", lastObservation);
  }
}
</script>

<template>
  <li tabindex="-1" :class="props.selected && 'selected'" @click="handleClick()">
    <!-- Observation Mode Content -->
    <span v-if="props.mode === 'observation'" class="content-wrapper obs">
      <span class="name">{{ props.obs.name }}</span>
      <location-specified-icon v-if="props.obs.location" />
      <span class="date">{{ formatDate(props.obs.date) }}</span>
      <span v-if="props.obs.owner && props.obs.owner !== 'unauthorized'" class="seen-by">
        <user-initial :user="props.obs.owner" />
      </span>
    </span>
    
    <!-- Species Mode Content -->
    <span v-else class="content-wrapper obs">
      <span class="name">{{ props.obs[0].name }}</span>
      <span class="date" v-if="props.obs.length > 0">{{ formatDate(props.obs[props.obs.length - 1].date) }}</span>
      <span v-if="props.obs.length > 0" class="seen-by">
        <user-initial v-for="user in [...new Set(props.obs.map((o) => o.owner))]" :key="user" :user="user" />
      </span>
    </span>
    
    <!-- Action Buttons (for all modes) -->
    <button type="button" class="edit-button" @click.stop="handleEdit">
      <template v-if="props.mode === 'observation' && !canEdit(props.obs.owner)">
        <view-icon />
      </template>
      <template v-else-if="props.mode === 'species' && props.obs.length > 0 && !canEdit(props.obs[props.obs.length - 1].owner)">
        <view-icon />
      </template>
      <template v-else>
        <edit-icon />
      </template>
    </button>
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

.content-wrapper + .edit-button {
  margin-left: -3rem;
  transform: translateX(3rem);
  transition: 0.1s transform ease-out;
  cursor: pointer;
  z-index: 1;
}

.list li.selected {
  background: var(--color-background-dim);
}

.list li.selected .content-wrapper {
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

.remove-button {
  z-index: 1;
}
</style>

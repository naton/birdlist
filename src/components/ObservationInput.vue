<script setup>
import { ref, onBeforeMount } from "vue";
import { storeToRefs } from 'pinia'
import AddLocationIcon from "./icons/AddLocationIcon.vue";
import FetchingLocationIcon from "./icons/FetchingLocationIcon.vue";
import LocationFoundIcon from "./icons/LocationFoundIcon.vue";
import vue3SimpleTypeahead from "vue3-simple-typeahead";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from '../stores/lists.js'
import { useBirdsStore } from "@/stores/birds.js";
import 'vue3-simple-typeahead/dist/vue3-simple-typeahead.css'; //Optional default CSS

const birdStore = useBirdsStore();
const { loadAllBirds } = birdStore;
const { birds } = storeToRefs(birdStore);

const settingsStore = useSettingsStore()
const { t } = settingsStore

const listsStore = useListsStore()
const { currentList } = storeToRefs(listsStore)

const emit = defineEmits(["add"]);
const props = defineProps(["lang"]);

const calculatingPosition = ref(false);
const currentPosition = ref("");

function toggleCurrentLocation() {
  if (!currentPosition.value) {
    calculatingPosition.value = true;

    const geoOptions = {
      enableHighAccuracy: false,
    };

    const geoSuccess = function (position) {
      currentPosition.value = [position.coords.latitude, position.coords.longitude].join(",");
      calculatingPosition.value = false;
    };

    const geoError = function (error) {
      calculatingPosition.value = false;
      console.log("Error occurred. Error code: " + error.code);
      // error.code can be:
      //   0: unknown error
      //   1: permission denied
      //   2: position unavailable (error response from location provider)
      //   3: timed out
    };

    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
  } else {
    currentPosition.value = "";
  }
}

const addObservationInput = ref();

function add(bird) {
  emit('add', bird.name, currentPosition.value);
  addObservationInput.value.clearInput();
}

onBeforeMount(() => {
  loadAllBirds(props.lang);
});
</script>

<template>
  <div class="add-observation">
    <button type="button" @click="toggleCurrentLocation" :class="{ 'is-tracking': calculatingPosition, 'has-position': currentPosition, }">
      <add-location-icon v-if="!currentPosition && !calculatingPosition"></add-location-icon>
      <fetching-location-icon v-else-if="calculatingPosition"></fetching-location-icon>
      <location-found-icon v-else></location-found-icon>
    </button>
    <vue3-simple-typeahead ref="addObservationInput" :placeholder="currentList.id?.startsWith('lst')
      ? t('Add_Bird_To') + ` ${currentList.title}…`
      : t('Enter_The_Name_Of_The_Bird')" :items="birds" :minInputLength="1" :itemProjection="(bird) => bird.name" @selectItem="(bird) => add(bird)">
    </vue3-simple-typeahead>
  </div>
</template>

<style>
.add-observation {
  display: flex;
  gap: 0.3rem;
  padding: 0.5rem 1rem;
}

.add-observation input {
  width: 100%;
  padding: 0.5rem 0.3rem 0.5rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-sizing: border-box;
  color: var(--color-text);
  background: var(--color-background);
  font-size: 1.4rem;
  appearance: none;
}

.add-observation input::placeholder {
  color: var(--color-text-dim);
}

.has-position {
  background: var(--color-background-dim);
  color: var(--color-text);
}

.nc-loop-ripple-16-icon-o {
  --animation-duration: 1.2s;
}

.nc-loop-ripple-16-icon-o * {
  transform-origin: 50% 50%;
  animation: nc-loop-ripple-anim var(--animation-duration) infinite cubic-bezier(0.215, 0.61, 0.355, 1);
}

.nc-loop-ripple-16-icon-o :nth-child(2) {
  animation-delay: calc(var(--animation-duration) / -2);
}

@keyframes nc-loop-ripple-anim {
  0% {
    opacity: 1;
    transform: scale(0.2);
  }

  100% {
    opacity: 0;
    transform: scale(1);
  }
}

.add-observation .simple-typeahead-list {
  bottom: 3rem;
  border-radius: var(--radius);
  box-shadow: rgb(17 17 26 / 12%) 0 -6px 12px 0;
}

.add-observation .simple-typeahead-list-footer,
.add-observation .simple-typeahead-list-header,
.add-observation .simple-typeahead-list-item {
  background-color: var(--color-background) !important;
}

.add-observation .simple-typeahead-list-item-active {
  background-color: var(--color-background-dim) !important;
}
</style>

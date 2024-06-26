<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from 'pinia'
import AddLocationIcon from "./icons/AddLocationIcon.vue";
import FetchingLocationIcon from "./icons/FetchingLocationIcon.vue";
import LocationFoundIcon from "./icons/LocationFoundIcon.vue";
import vue3SimpleTypeahead from "vue3-simple-typeahead";
import { useSettingsStore } from '../stores/settings.js'
import { useBirdsStore } from "@/stores/birds.js";
import 'vue3-simple-typeahead/dist/vue3-simple-typeahead.css'; //Optional default CSS

const route = useRoute();

const birdStore = useBirdsStore();
const { loadAllBirds } = birdStore;
const { birds } = storeToRefs(birdStore);

const settingsStore = useSettingsStore()
const { t } = settingsStore

const emit = defineEmits(["add"]);
const props = defineProps(["locale"]);

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

function addUnlistedBird() {
  const newBird = { name: addObservationInput.value.getInput().value };
  add(newBird);
}

onMounted(() => {
  loadAllBirds(props.locale);
});
</script>

<template>
  <form class="add-bird">
    <button type="button" @click="toggleCurrentLocation" :class="{ 'is-tracking': calculatingPosition, 'has-position': currentPosition, }">
      <add-location-icon v-if="!currentPosition && !calculatingPosition"></add-location-icon>
      <fetching-location-icon v-else-if="calculatingPosition"></fetching-location-icon>
      <location-found-icon v-else></location-found-icon>
    </button>
    <vue3-simple-typeahead ref="addObservationInput" :placeholder="route.params.id
      ? `${t('Add_Bird_To')} ${t('This_List').toLowerCase()}…`
      : t('Enter_The_Name_Of_The_Bird')" :items="birds" :minInputLength="1" :itemProjection="(bird) => bird.name" @selectItem="(bird) => add(bird)" @keyup.enter="addUnlistedBird">
    </vue3-simple-typeahead>
  </form>
</template>

<style>
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
</style>

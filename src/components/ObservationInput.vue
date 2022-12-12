<script setup>
import { ref } from "vue";

const props = defineProps(["list"]);
const emit = defineEmits(["add"]);

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
</script>

<template>
  <div class="add-observation">
    <input
      name="bird"
      type="text"
      list="birds"
      @change="emit('add', $event, props.list, currentPosition)"
      autocomplete="off"
      :placeholder="
        props.list.id && props.list.id.startsWith('lst')
          ? `Lägg till 🐦 på ${list.title}…`
          : 'Skriv namnet på 🐦 du sett…'
      "
    />
    <button
      type="button"
      @click="toggleCurrentLocation"
      :class="{
        'is-tracking': calculatingPosition,
        'has-position': currentPosition,
      }"
    >
      <svg
        v-if="!currentPosition && !calculatingPosition"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        title="Lägg till plats"
      >
        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 15.5S.5 10.5.5 6a5.5 5.5 0 0 1 10.909-1" />
          <circle cx="6" cy="6" r="1.5" />
          <circle cx="11.5" cy="11.5" r="4" />
          <path d="M11.5 9.5v4m-2-2h4" />
        </g>
      </svg>
      <svg
        v-else-if="calculatingPosition"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        width="16px"
        height="16px"
        viewBox="0 0 16 16"
        stroke-width="2"
        title="Hämtar din plats…"
      >
        <g stroke-width="2" transform="translate(0, 0)">
          <g class="nc-loop-ripple-16-icon-o" stroke-width="2">
            <circle cx="8" cy="8" fill="none" r="9" stroke="currentColor" stroke-width="2"></circle>
            <circle
              data-color="color-2"
              cx="8"
              cy="8"
              fill="none"
              r="9"
              stroke="currentColor"
              stroke-width="2"
            ></circle>
          </g>
        </g>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" title="Plats hittad">
        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 15.5s-5.5-5-5.5-9.5a5.5 5.5 0 0 1 11 0 6.883 6.883 0 0 1-.322 2" />
          <circle cx="8" cy="6" r="1.5" />
          <path d="m8.5 11.5 2 2 4-4" />
        </g>
      </svg>
    </button>
  </div>
</template>

<style>
.add-observation {
  display: flex;
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
  font-size: 1.1rem;
  appearance: none;
}

.add-observation input::placeholder {
  color: var(--color-text-dim);
}

.add-observation button {
  margin-left: 0.3rem;
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
</style>

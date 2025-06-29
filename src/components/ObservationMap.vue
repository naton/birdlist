<template>
  <div class="map-container" ref="mapContainer">
    <div v-if="location" id="observation-map" :style="{ height: height + 'px', width: '100%' }"></div>
    <div v-else class="map-placeholder" :style="{ height: height + 'px' }">
      {{ t("No_Location_Data") }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';

const props = defineProps({
  location: {
    type: String,
    default: null
  },
  height: {
    type: Number,
    default: 200
  },
  // New prop to control map initialization
  visible: {
    type: Boolean,
    default: true
  }
});

const settingsStore = useSettingsStore();
const { t } = settingsStore;

const mapContainer = ref(null);
const map = shallowRef(null);
const marker = shallowRef(null);
const leafletLoaded = shallowRef(false);
const leafletLoading = shallowRef(false);

// Function to load Leaflet library and CSS dynamically
async function loadLeaflet() {
  // Don't load if already loaded or loading
  if (window.L || leafletLoaded.value || leafletLoading.value) {
    if (window.L) leafletLoaded.value = true;
    return window.L ? Promise.resolve() : new Promise(resolve => {
      // Wait for current loading to complete
      const checkInterval = setInterval(() => {
        if (leafletLoaded.value) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  leafletLoading.value = true;
  
  // Load CSS
  return new Promise((resolve) => {
    const linkElem = document.createElement('link');
    linkElem.rel = 'stylesheet';
    linkElem.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(linkElem);
    
    // Load JavaScript
    const scriptElem = document.createElement('script');
    scriptElem.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    scriptElem.onload = () => {
      leafletLoaded.value = true;
      leafletLoading.value = false;
      resolve();
    };
    document.head.appendChild(scriptElem);
  });
}

// Initialize or update the map when the component is mounted or location changes
async function initMap() {
  // Skip initialization if not visible or no location
  if (!props.visible || !props.location) return;
  
  const [lat, lon] = props.location.split(',').map(coord => parseFloat(coord.trim()));
  
  // If there's no valid coordinates, don't try to create a map
  if (isNaN(lat) || isNaN(lon)) return;
  
  // Load Leaflet dynamically if needed
  if (!leafletLoaded.value) {
    await loadLeaflet();
  }
  
  // Now Leaflet is loaded, we can create or update the map
  createMap(lat, lon);
}

function createMap(lat, lon) {
  // If the map already exists, just update the view and marker
  if (map.value) {
    map.value.setView([lat, lon], 14);
    if (marker.value) {
      marker.value.setLatLng([lat, lon]);
    } else {
      marker.value = window.L.marker([lat, lon]).addTo(map.value);
    }
    return;
  }
  
  // Create a new map
  map.value = window.L.map('observation-map').setView([lat, lon], 14);
  
  // Add the OpenStreetMap tiles
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value);
  
  // Add a marker at the location
  marker.value = window.L.marker([lat, lon]).addTo(map.value);
  
  // Ensure the map container is properly sized
  setTimeout(() => {
    if (map.value) map.value.invalidateSize();
  }, 100);
}

// Clean up the map resources when the component is unmounted
function cleanupMap() {
  if (map.value) {
    map.value.remove();
    map.value = null;
    marker.value = null;
  }
}

onMounted(() => {
  if (props.visible) {
    initMap();
  }
});

onUnmounted(() => {
  cleanupMap();
});

// Watch for changes in the location prop
watch(() => props.location, () => {
  if (props.visible) {
    initMap();
  }
});

// Watch for changes in visibility
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.location) {
    initMap();
  } else if (!newVisible && map.value) {
    cleanupMap();
  }
});
</script>

<style>
.map-container {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--color-border);
  margin-bottom: 1rem;
  border-radius: var(--radius);
}

.map-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background-dim);
  color: var(--color-text-dim);
}
</style>

<template>
  <div 
    class="map-container" 
    ref="mapContainer"
    :class="{ 'editable': editable }"
  >
    <div v-if="location" id="observation-map" :style="{ height: height + 'px', width: '100%' }"></div>
    <div v-else class="map-placeholder" :style="{ height: height + 'px' }">
      {{ t("No_Location_Data") }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';

// Use defineModel for two-way binding with location
const location = defineModel('location');

const props = defineProps({
  height: {
    type: Number,
    default: 200
  },
  // New prop to control map initialization
  visible: {
    type: Boolean,
    default: true
  },
  // New prop to enable marker dragging in edit mode
  editable: {
    type: Boolean,
    default: false
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
  if (!props.visible || !location.value) return;
  
  const [lat, lon] = location.value.split(',').map(coord => parseFloat(coord.trim()));
  
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
      createMarker(lat, lon);
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
  createMarker(lat, lon);
  
  // Ensure the map container is properly sized
  setTimeout(() => {
    if (map.value) map.value.invalidateSize();
  }, 100);
}

// Helper function to create and configure the marker
function createMarker(lat, lon) {
  // Remove existing marker if any
  if (marker.value) {
    marker.value.remove();
  }
  
  // Create marker with draggable option based on editable prop
  marker.value = window.L.marker([lat, lon], {
    draggable: props.editable
  }).addTo(map.value);
  
  // If editable, add drag events
  if (props.editable) {
    // Add instruction popup if in edit mode
    map.value.openPopup(
      window.L.popup()
        .setLatLng([lat, lon])
        .setContent(`<div>${t("Drag_Marker_To_Move")}</div>`)
    );
    
    // Update coordinates when marker is dragged
    marker.value.on('dragend', (event) => {
      const newPos = event.target.getLatLng();
      const newLocation = `${newPos.lat.toFixed(6)},${newPos.lng.toFixed(6)}`;
      location.value = newLocation;
    });
    
    // Also enable click-to-move anywhere on the map
    map.value.on('click', (event) => {
      const newPos = event.latlng;
      marker.value.setLatLng(newPos);
      const newLocation = `${newPos.lat.toFixed(6)},${newPos.lng.toFixed(6)}`;
      location.value = newLocation;
    });
  }
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
watch(() => location.value, () => {
  if (props.visible) {
    initMap();
  }
});

// Watch for changes in visibility
watch(() => props.visible, (newVisible) => {
  if (newVisible && location.value) {
    initMap();
  } else if (!newVisible && map.value) {
    cleanupMap();
  }
});

// Watch for changes in editable state
watch(() => props.editable, () => {
  if (map.value && marker.value && props.visible && location.value) {
    // Get current position
    const [lat, lon] = location.value.split(',').map(coord => parseFloat(coord.trim()));
    if (!isNaN(lat) && !isNaN(lon)) {
      // Recreate marker with new draggable state
      createMarker(lat, lon);
    }
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
  position: relative;
}

.map-container.editable #observation-map {
  cursor: crosshair;
}

.map-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background-dim);
  color: var(--color-text-dim);
}
</style>

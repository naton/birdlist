<script setup>
import { ref, defineAsyncComponent, computed, watch } from "vue";
import { storeToRefs } from 'pinia'
import { formatDateAndTime, inputDateTime, toSafeUserLabel } from "@/helpers";
import { getBirdDisplayName, getBirdLatinName, getBirdStorageName } from "@/birdNames.js";
import AppDialog from "@/shared/ui/AppDialog.vue";
import vue3SimpleTypeahead from "vue3-simple-typeahead";
import "vue3-simple-typeahead/dist/vue3-simple-typeahead.css";
import BirdsIcon from "@/shared/icons/BirdsIcon.vue";
import DeleteIcon from "@/shared/icons/DeleteIcon.vue";
import EditIcon from "@/shared/icons/EditIcon.vue";
import ListsIcon from "@/shared/icons/ListsIcon.vue";
import LocationFoundIcon from "@/shared/icons/LocationFoundIcon.vue";
import ObservationsIcon from "@/shared/icons/ObservationsIcon.vue";
import UserIcon from "@/shared/icons/UserIcon.vue";
// Lazy load the map component
const ObservationMap = defineAsyncComponent(() => import("./ObservationMap.vue"));
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useBirdsStore } from "@/stores/birds.js";
import { useFriendsStore } from "@/stores/friends.js";

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { currentUser, lang, locale } = storeToRefs(settingsStore)

const listsStore = useListsStore()
const { allLists } = storeToRefs(listsStore)

const observationsStore = useObservationsStore()
const { saveObservation } = observationsStore
const birdsStore = useBirdsStore();
const { loadAllBirds } = birdsStore;
const { birds } = storeToRefs(birdsStore);
const friendsStore = useFriendsStore();
const { getFriendlyName } = friendsStore;

const emit = defineEmits(["delete"]);

const currentObservation = defineModel();
const isDialogOpen = ref(false);
const isEditing = ref(false);

// Create a working copy for edits
const editDraft = ref(null);
const selectedBird = ref(null);

// Computed property to handle the active observation (draft when editing, current otherwise)
const activeObservation = computed(() => 
  isEditing.value && editDraft.value ? editDraft.value : currentObservation.value
);

// Computed property for the location to allow v-model binding with the map component
const locationModel = computed({
  get: () => activeObservation.value?.location,
  set: (value) => {
    if (isEditing.value && editDraft.value) {
      editDraft.value.location = value;
    }
  }
});

function currentListName() {
  const list = allLists.value?.find(list => list.id == activeObservation.value?.listId);
  return list ? list.title : t("No_Special_List");
}

function canEdit(owner) {
  return owner === "unauthorized" || currentUser?.value.name === owner;
}

function getOwnerLabel(owner) {
  const aliases = [
    currentUser.value?.userId,
    currentUser.value?.email,
    currentUser.value?.name,
  ].filter(Boolean);

  if (aliases.includes(owner)) {
    return t("Me");
  }

  return toSafeUserLabel(owner, getFriendlyName(owner));
}

function birdName(observation) {
  return getBirdDisplayName(observation, lang?.value || "en");
}

const canSave = computed(() => {
  if (!editDraft.value) {
    return false;
  }

  return !selectedBird.value || Boolean(selectedBird.value.latinName);
});

function deleteAndClose(id) {
  emit("delete", id);
  isEditing.value = false;
  isDialogOpen.value = false;
}

function openModal() {
  isDialogOpen.value = true;
}

// Create a deep clone of an object
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    return new Date(obj);
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  // Handle objects
  const clone = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
}

function startEditing() {
  // Create a deep copy of the observation for editing
  // This ensures all changes are isolated until explicitly saved
  editDraft.value = deepClone(currentObservation.value);
  selectedBird.value = null;
  loadAllBirds(locale?.value || "en-US", lang?.value || "en");
  isEditing.value = true;
}

function close() {
  // Discard any changes by abandoning the editDraft
  // This ensures no changes are applied to the original observation
  editDraft.value = null;
  selectedBird.value = null;
  isEditing.value = false;
  isDialogOpen.value = false;
}

function selectBird(bird) {
  if (!bird?.latinName || !editDraft.value) {
    return;
  }

  selectedBird.value = bird;
  editDraft.value.latinName = bird.latinName;
  editDraft.value.name = getBirdStorageName(bird, lang?.value || "en");
}

function saveAndClose() {
  // Only apply changes when explicitly saving
  if (editDraft.value && canSave.value) {
    // Update the current observation with all changes from editDraft
    const latinName = editDraft.value.latinName || getBirdLatinName(editDraft.value);
    if (latinName) {
      editDraft.value.latinName = latinName;
      editDraft.value.name = getBirdStorageName(editDraft.value, lang?.value || "en");
    }
    Object.assign(currentObservation.value, editDraft.value);
    // Save to the store
    saveObservation(currentObservation.value);
  }
  editDraft.value = null;
  selectedBird.value = null;
  isEditing.value = false;
  isDialogOpen.value = false;
}

watch(
  [locale, lang],
  ([newLocale, newLang]) => {
    if (isEditing.value) {
      loadAllBirds(newLocale || "en-US", newLang || "en");
    }
  }
);

defineExpose({
  showModal: openModal,
  close,
});
</script>

<template>
  <app-dialog v-model="isDialogOpen">
    <div class="grid margin-bottom">
      <birds-icon />
      <h2 v-if="!isEditing">{{ birdName(activeObservation) }}</h2>
      <div v-else>
        <label for="obs-name">{{ t("Change_Name") }}</label>
        <p class="current-species">{{ birdName(editDraft) }}</p>
        <vue3-simple-typeahead
          id="obs-name"
          :placeholder="t('Select_Bird')"
          :items="birds.filter((bird) => bird.latinName)"
          :minInputLength="1"
          :itemProjection="(bird) => bird.name"
          @selectItem="selectBird"
        />
      </div>
  
      <observations-icon />
      <h3 v-if="!isEditing">{{ formatDateAndTime(activeObservation?.date) }}</h3>
      <div v-else class="margin-bottom">
        <label for="obs-date">{{ t("Change_Date") }}</label>
        <input id="obs-date" type="datetime-local" 
          @input="editDraft.date = new Date($event.target.value)" 
          :value="inputDateTime(editDraft.date)" />
      </div>
  
      <user-icon />
      <p>{{ getOwnerLabel(activeObservation?.owner) }}</p>

      <lists-icon />
      <p v-if="!isEditing">{{ currentListName() }}</p>
      <div v-else class="margin-bottom">
        <label for="obs-list">{{ t("Change_List") }}</label>
        <select id="obs-list" v-model="editDraft.listId">
          <option value="undefined">{{ t("No_Special_List") }}</option>
          <option 
            v-for="{ id, title } in allLists" 
            :value="id" 
            :key="id" 
            :selected="id === editDraft?.listId && 'selected'"
          >
            {{ title }}
          </option>
        </select>
      </div>

      <!-- Map section -->
      <template v-if="activeObservation?.location">
        <location-found-icon width="24" height="24" />
        <div>
          <p>{{ t("Location") }}:</p>
          <p v-if="isEditing" class="location-hint">{{ t("Move_Marker_To_Change_Location") }}</p>
        </div>
      </template>
      <div v-if="activeObservation?.location" class="full-width">
        <observation-map 
          v-model:location="locationModel" 
          :height="200"
          :visible="isDialogOpen"
          :editable="isEditing"
        ></observation-map>
        <a 
          :href="`https://www.openstreetmap.org/#map=16/${activeObservation.location.replace(',', '/')}`" 
          target="_blank" 
          class="poi"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="24" height="24">
            <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13.5 6c0 4.5-5.5 9.5-5.5 9.5s-5.5-5-5.5-9.5a5.5 5.5 0 0 1 11 0Z" />
              <circle cx="8" cy="6" r="2.5" />
            </g>
          </svg>
          {{ t("Open_In_Full_Map") }}
        </a>
      </div>
    </div>

    <div class="buttons">
      <button v-if="isEditing" type="button" class="secondary" :disabled="!canSave" @click="saveAndClose">{{ t("Save") }} & {{ t("Close") }}</button>
      <button v-else type="button" class="secondary" :disabled="!canEdit(currentObservation?.owner)" @click="startEditing">
        <edit-icon />
        {{ t("Edit") }}
      </button>
      <button v-if="isEditing" type="button" @click="deleteAndClose(currentObservation?.id)">
        <delete-icon />
        {{ t("Delete") }}
      </button>
      <!-- Cancel button - discards all changes (name, date, list, location) by abandoning the editDraft -->
      <button type="button" class="secondary" @click="close">{{ t("Cancel") }}</button>
    </div>
  </app-dialog>
</template>

<style>
button[disabled] {
  opacity: 0.4;
}

.full-width {
  grid-column: 1 / -1;
  width: 100%;
}

.poi {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);
  text-decoration: none;
}

.poi svg {
  color: var(--color-primary);
}

.location-hint {
  font-size: 0.8rem;
  margin-top: 0;
  font-style: italic;
  color: var(--color-text-dim);
}

.current-species {
  margin: 0 0 0.5rem;
  color: var(--color-text-dim);
}
</style>

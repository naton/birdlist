<script setup>
import { ref, defineAsyncComponent } from "vue";
import { storeToRefs } from 'pinia'
import { formatDateAndTime, inputDateTime } from "@/helpers";
import AppDialog from "./AppDialog.vue";
import ObservationsIcon from "./icons/ObservationsIcon.vue";
import LocationFoundIcon from "./icons/LocationFoundIcon.vue";
import BirdsIcon from "./icons/BirdsIcon.vue";
import ListsIcon from "./icons/ListsIcon.vue";
import UserIcon from "./icons/UserIcon.vue";
import EditIcon from "./icons/EditIcon.vue";
import DeleteIcon from "./icons/DeleteIcon.vue";
// Lazy load the map component
const ObservationMap = defineAsyncComponent(() => import("./ObservationMap.vue"));
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from '../stores/lists.js'
import { useObservationsStore } from '../stores/observations.js'

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { currentUser } = storeToRefs(settingsStore)

const listsStore = useListsStore()
const { allLists } = storeToRefs(listsStore)

const observationsStore = useObservationsStore()
const { saveObservation } = observationsStore

const emit = defineEmits(["delete"]);

const currentObservation = defineModel();
const isDialogOpen = ref(false);
const isEditing = ref(false);

function currentListName() {
  const list = allLists.value?.find(list => list.id == currentObservation.value?.listId);
  return list ? list.title : t("No_Special_List");
}

function canEdit(owner) {
  return owner === "unauthorized" || currentUser?.value.name === owner;
}

function deleteAndClose(id) {
  emit("delete", id);
  close();
}

function openModal() {
  isDialogOpen.value = true;
}

function close() {
  isEditing.value = false;
  isDialogOpen.value = false;
}

function saveAndClose() {
  saveObservation(currentObservation.value);
  close();
}

defineExpose({
  showModal: openModal,
  close,
});
</script>

<template>
  <app-dialog v-model="isDialogOpen">
    <div class="grid margin-bottom">
      <birds-icon />
      <h2 v-if="!isEditing">{{ currentObservation?.name }}</h2>
      <div v-else>
        <label for="obs-name">{{ t("Change_Name") }}</label>
        <input id="obs-name" type="text" v-model="currentObservation.name" />
      </div>
  
      <observations-icon />
      <h3 v-if="!isEditing">{{ formatDateAndTime(currentObservation?.date) }}</h3>
      <div v-else class="margin-bottom">
        <label for="obs-date">{{ t("Change_Date") }}</label>
        <input id="obs-date" type="datetime-local" @input="currentObservation.date = new Date($event.target.value)" :value="inputDateTime(currentObservation.date)" />
      </div>
  
      <user-icon />
      <p>{{ currentObservation?.owner }}</p>

      <lists-icon />
      <p v-if="!isEditing">{{ currentListName() }}</p>
      <div v-else class="margin-bottom">
        <label for="obs-list">{{ t("Change_List") }}</label>
        <select id="obs-list" v-model="currentObservation.listId">
          <option value="undefined">{{ t("No_Special_List") }}</option>
          <option v-for="{ id, title } in allLists" :value="id" :key="id" :selected="id === currentObservation?.listId && 'selected'">
            {{ title }}
          </option>
        </select>
      </div>

      <!-- Map section -->
      <template v-if="currentObservation?.location">
        <location-found-icon v-if="currentObservation?.location" width="24" height="24" />
        <p>{{ t("Location") }}:</p>
      </template>
      <div v-if="currentObservation?.location" class="full-width">
        <observation-map 
          :location="currentObservation.location" 
          :height="200"
          :visible="isDialogOpen"
        ></observation-map>
        <a :href="`https://www.openstreetmap.org/#map=16/${currentObservation.location.replace(',', '/')}`" target="_blank" class="poi">
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
      <button v-if="isEditing" type="button" class="secondary" @click="saveAndClose">{{ t("Save") }} & {{ t("Close") }}</button>
      <button v-else type="button" class="secondary" :disabled="!canEdit(currentObservation?.owner)" @click="isEditing = true">
        <edit-icon />
        {{ t("Edit") }}
      </button>
      <button v-if="isEditing" type="button" @click="deleteAndClose(currentObservation?.id)">
        <delete-icon />
        {{ t("Delete") }}
      </button>
      <button type="button" class="secondary" @click="close()">{{ t("Cancel") }}</button>
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
</style>

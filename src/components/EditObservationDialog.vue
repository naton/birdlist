<script setup>
import { ref, defineModel } from "vue";
import { storeToRefs } from 'pinia'
import { formatDateAndTime, inputDateTime } from "@/helpers";
import ObservationsIcon from "./icons/ObservationsIcon.vue";
import BirdsIcon from "./icons/BirdsIcon.vue";
import ListsIcon from "./icons/ListsIcon.vue";
import UserIcon from "./icons/UserIcon.vue";
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

const editObservationDialog = ref(null);

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
  closeModal();
}

function openModal() {
  editObservationDialog.value.showModal();
}

function closeModal() {
  isEditing.value = false;
  editObservationDialog.value.close();
}

function saveAndClose() {
  saveObservation(currentObservation.value);
  closeModal();
}

defineExpose({
  openModal,
  closeModal,
});
</script>

<template>
  <dialog ref="editObservationDialog" class="dialog">
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
      <div v-if="currentObservation?.location" class="margin-bottom">
        <a :href="`https://www.openstreetmap.org/#map=16/${currentObservation.location.replace(',', '/')}`" target="_blank" class="poi">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="24" height="24">
            <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13.5 6c0 4.5-5.5 9.5-5.5 9.5s-5.5-5-5.5-9.5a5.5 5.5 0 0 1 11 0Z" />
              <circle cx="8" cy="6" r="2.5" />
            </g>
          </svg>
          {{ t("Show_On_Map") }}
        </a>
      </div>
      
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
    </div>

    <div class="buttons">
      <button v-if="isEditing" type="button" class="secondary" @click="saveAndClose">{{ t("Save") }} & {{ t("Close") }}</button>
      <button v-else type="button" class="secondary" :disabled="!canEdit(currentObservation?.owner)" @click="isEditing = true">{{ t("Edit") }}</button>
      <button v-if="isEditing" type="button" @click="deleteAndClose(currentObservation?.id)">{{ t("Delete") }}</button>
      <button type="button" class="secondary" @click="closeModal()">{{ t("Cancel") }}</button>
    </div>
  </dialog>
</template>

<style>
button[disabled] {
  opacity: 0.4;
  filter: grayscale(1);
}
</style>

<script setup>
import { ref, computed, watch } from "vue";
import { inputDate } from "@/helpers";
import AppDialog from "./AppDialog.vue";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from '../stores/lists.js'
import ListsIcon from "./icons/ListsIcon.vue";
import NormalIcon from "@/components/icons/NormalIcon.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import BingoIcon from "@/components/icons/BingoIcon.vue";
import StreakIcon from "@/components/icons/StreakIcon.vue";
import DeleteIcon from "./icons/DeleteIcon.vue";

const settingsStore = useSettingsStore()
const { t } = settingsStore

const listsStore = useListsStore()
const { updateList, deleteList, isOwnedByCurrentUser } = listsStore

// Using defineModel for both the list data and the dialog open state
const listToEdit = defineModel('list');
const isDialogOpen = defineModel('modelValue', { default: false });

// Create a draft object to hold all edits until they're saved
const listDraft = ref(null);

const isListOwner = computed(() => isOwnedByCurrentUser(listToEdit.value));

// Deep clone function (reused from EditObservationDialog)
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

// Watch for changes to the input list and create a draft copy
watch([listToEdit, isDialogOpen], ([list, isOpen]) => {
  if (!list || !isOpen) {
    // Don't create a draft if the list is null or the dialog is closed
    return;
  }
  
  // Create a deep copy of the list for editing
  listDraft.value = deepClone(list);
  
  // Set default type if not present
  if (!listDraft.value.type) {
    listDraft.value.type = 'normal';
  }
}, { immediate: true })

function openModal() {
  // Ensure the dialog is open first, then the watch will create the draft
  isDialogOpen.value = true;
}

function saveList() {
  if (!listDraft.value) return;
  
  // Ensure title and description are trimmed
  listDraft.value.title = listDraft.value.title?.trim();
  listDraft.value.description = listDraft.value.description?.trim();
  
  // Update the timestamp
  listDraft.value.updated = new Date();
  
  // Apply the updates from draft to original list
  Object.assign(listToEdit.value, listDraft.value);
  
  // Save to the store
  updateList(listToEdit.value);
  close();
}

function close() {
  // Discard the draft without saving changes
  listDraft.value = null;
  isDialogOpen.value = false;
}

// Expose these methods for direct calling via ref
defineExpose({
  showModal: openModal,
  close,
})
</script>

<template>
  <app-dialog v-model="isDialogOpen">
    <div v-if="listDraft" class="grid">
      <lists-icon />
      <h2>{{ t("Edit_List") }}</h2>
    </div>
    <template v-if="listDraft">
      <label for="list-title">{{ t("List_Name") }}:</label>
      <input type="text" id="list-title" v-model="listDraft.title" @keyup.esc="close" :placeholder="t('Enter_The_Name_Of_The_List')" />
      <label for="list-description">{{ t("Description") }}:</label>
      <textarea id="list-description" v-model="listDraft.description" cols="30" rows="5" :placeholder="t('List_Rules_Etc')"></textarea>
      <label for="title">{{ t("Type_Of_List") }}:</label>
      <div class="flex">
        <label class="radio">
          <normal-icon />
          <input v-model="listDraft.type" type="radio" disabled value="normal" />{{ t("Normal") }}
        </label>
        <label class="radio">
          <check-icon />
          <input v-model="listDraft.type" type="radio" disabled value="checklist" />{{ t("Checklist") }}
        </label>
        <label class="radio">
          <bingo-icon />
          <input v-model="listDraft.type" type="radio" disabled value="bingo" />{{ t("Bingo") }}
        </label>
        <label class="radio">
          <streak-icon />
          <input v-model="listDraft.type" type="radio" disabled value="birdstreak" />{{ t("Birdstreak") }}
        </label>
      </div>
      <template v-if="listDraft.type === 'bingo'">
        <fieldset class="flex margin-top">
          <legend>{{ t("Size") }}</legend>
          <label class="radio">
            <bingo-icon />
            <input type="radio" value="3" v-model="listDraft.bingoSize" />3 ✕ 3
          </label>
          <label class="radio">
            <bingo-icon />
            <input type="radio" value="4" v-model="listDraft.bingoSize" />4 ✕ 4
          </label>
          <label class="radio">
            <bingo-icon />
            <input type="radio" value="5" v-model="listDraft.bingoSize" />5 ✕ 5
          </label>
        </fieldset>
      </template>
      <template v-if="listDraft.type === 'birdstreak'">
        <div class="flex">
          <div class="half">
            <label for="start-date">{{ t("Start_Date") }}:</label>
            <input type="date" @input="listDraft.startDate = new Date($event.target.value)" :value="inputDate(listDraft.startDate)" />
          </div>
          <div class="half">
            <label for="end-date">{{ t("End_Date") }}:</label>
            <input type="date" @input="listDraft.endDate = new Date($event.target.value)" :value="inputDate(listDraft.endDate)" />
          </div>
        </div>
        <label for="day-interval">{{ t("Report_Interval") }}:</label>
        <select v-model.number="listDraft.reportInterval">
          <option value="1">{{ t("Every_Day") }}</option>
          <option value="2">{{ t("Every_Other_Day") }}</option>
          <option value="3">{{ t("Every_Third_Day") }}</option>
          <option value="7">{{ t("Every_Week") }}</option>
        </select>
      </template>
      <div class="buttons">
        <button v-if="isListOwner" class="update-button" @click="saveList">{{ t("Save") }}</button>
        <button v-if="isListOwner && listToEdit.title" class="delete-button" @click="deleteList(listToEdit.id)">
          <delete-icon />
          {{ t("Delete") }}
        </button>
        <button @click="close" class="secondary">{{ t("Cancel") }}</button>
      </div>
    </template>
    <div v-if="!listDraft" class="loading">
      {{ t("Loading") }}...
    </div>
  </app-dialog>
</template>

<style>
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  font-style: italic;
  color: var(--color-text-dim);
}
</style>
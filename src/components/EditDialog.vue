<script setup>
import { ref, defineExpose } from "vue";
import { storeToRefs } from 'pinia'
import { getTiedRealmId } from "dexie-cloud-addon";
import { db } from "../db";
import { formatDateAndTime, inputDate } from "@/helpers";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from '../stores/lists.js'

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { currentUser } = storeToRefs(settingsStore)

const listsStore = useListsStore()
const { myLists } = storeToRefs(listsStore)

const emit = defineEmits(["delete"]);

const currentObservation = defineModel();

const editDialog = ref(null);

const isEditing = ref(false);

function currentListName() {
  const list = myLists.value?.find(list => list.id == currentObservation.value?.listId);
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
  editDialog.value.showModal();
}

function closeModal() {
  isEditing.value = false;
  editDialog.value.close();
}

async function save() {
  const obs = currentObservation.value;
  const name = obs.name.trim();
  const date = obs.date;
  const location = obs.location;
  const listId = obs.listId;
  const realmId = getTiedRealmId(obs.listId);
  await db.transaction("rw", [db.lists, db.observations], async () => {
    // Move list into the realm (if not already there):
    await db.lists.update(listId, { realmId });
    await db.observations.update(obs, {
      name,
      date,
      realmId,
      listId,
      location,
    });
    await db.observations.where({ listId: listId }).modify({ realmId: realmId });
  });
}

function saveAndClose() {
  save();
  closeModal();
  isEditing.value = false;
}

defineExpose({
  openModal,
  closeModal,
});
</script>

<template>
  <dialog ref="editDialog" class="dialog">
    <h2 v-if="!isEditing">{{ currentObservation?.name }}</h2>
    <div v-else>
      <label for="obs-name">{{ t("Change_Name") }}</label>
      <input id="obs-name" type="text" v-model="currentObservation.name" />
    </div>

    <h3 v-if="!isEditing">{{ formatDateAndTime(currentObservation?.date) }}</h3>
    <div v-else>
      <label for="obs-date">{{ t("Change_Date") }}</label>
      <input id="obs-date" type="datetime-local" @input="currentObservation.date = new Date($event.target.value)" :value="inputDate(currentObservation.date)" />
    </div>

    <p v-if="!isEditing">{{ t("List") }}: {{ currentListName() }}</p>
    <div v-else>
      <label for="obs-list">{{ t("Change_List") }}</label>
      <select id="obs-list" v-model="currentObservation.listId">
        <option value="">{{ t("No_Special_List") }}</option>
        <option v-for="{ id, title } in myLists" :value="id" :key="id" :selected="id === currentObservation?.listId && 'selected'">
          {{ title }}
        </option>
      </select>
    </div>

    <p class="margin-bottom">{{ t("By") }}: {{ currentObservation?.owner }}</p>
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

    <div>
      <button v-if="isEditing" type="button" class="secondary" @click="saveAndClose()">{{ t("Save") }} & {{ t("Close") }}</button>
      <button v-else type="button" class="secondary" :disabled="!canEdit(currentObservation?.owner)" @click="isEditing = true">{{ t("Edit") }}</button>
      <button v-if="isEditing" type="button" @click="deleteAndClose(currentObservation?.id)">{{ t("Delete") }}</button>
      <button type="button" class="secondary" @click="closeModal()">{{ t("Cancel") }}</button>
    </div>
  </dialog>
</template>

<style>
.dialog h2 {
  font-weight: bold;
}

button[disabled] {
  opacity: 0.4;
  filter: grayscale(1);
}

.dialog label {
  display: block;
  margin-top: 1rem;
  font-weight: bold;
}

.dialog select,
.dialog input,
.dialog textarea {
  font-size: 1.5rem;
}

.dialog .poi {
  color: var(--color-link);
  text-decoration: none;
}

.dialog .poi svg {
  vertical-align: top;
}

.margin-bottom {
  margin-bottom: 1rem;
}
</style>

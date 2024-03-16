<script setup>
import { ref, defineExpose } from "vue";
import { storeToRefs } from 'pinia'
import { getTiedRealmId } from "dexie-cloud-addon";
import { db } from "../db";
import { formatDateAndTime, inputDate } from "@/helpers";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from '../stores/lists.js'
import { useObservationsStore } from '../stores/observations.js'

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { currentUser } = storeToRefs(settingsStore)

const listsStore = useListsStore()
const { myLists } = storeToRefs(listsStore)

const observationsStore = useObservationsStore();
const { editDialog } = storeToRefs(observationsStore);

const emit = defineEmits(["delete", "close"]);

const currentObservation = defineModel();

const selectedList = ref(currentObservation?.value.listId);
const selectedListRealm = ref(currentObservation?.value.realmId);

function canEdit(owner) {
  return owner === "unauthorized" || currentUser.name === owner;
}

function updateList(val) {
  selectedList.value = val;
  selectedListRealm.value = getTiedRealmId(val);
}

function deleteAndClose(id, elm) {
  emit("delete", id);
  close(elm);
}

function showModal() {
  editDialog.$el.showModal();
}

function close(elm) {
  elm.closest("dialog").close();
}

async function save() {
  const name = currentObservation?.value.name.trim();
  const date = currentObservation?.value.date;
  const location = currentObservation?.value.location;
  const listId = selectedList.value;
  const realmId = selectedListRealm.value;
  await db.transaction("rw", [db.lists, db.observations], async () => {
    // Move list into the realm (if not already there):
    await db.lists.update(listId, { realmId });
    await db.observations.update(currentObservation.value, {
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
  emit("close");
}

defineExpose({
  showModal,
});
</script>

<template>
  <dialog ref="editDialog" class="dialog" v-if="currentObservation">
    <h2>{{ currentObservation.name }}</h2>
    <h3>{{ formatDateAndTime(currentObservation.date) }}</h3>
    <p class="margin-bottom">{{ t("By") }}: {{ currentObservation.owner }}</p>
    <div v-if="currentObservation.location" class="margin-bottom">
      <a
        :href="`https://www.openstreetmap.org/#map=16/${currentObservation.location.replace(',', '/')}`"
        target="_blank"
        class="poi"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="24" height="24">
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13.5 6c0 4.5-5.5 9.5-5.5 9.5s-5.5-5-5.5-9.5a5.5 5.5 0 0 1 11 0Z" />
            <circle cx="8" cy="6" r="2.5" />
          </g>
        </svg>
        {{ t("Show_On_Map") }}
      </a>
    </div>

    <details v-if="canEdit(currentObservation?.owner)" class="margin-bottom">
      <summary>{{ t("Edit_Observation") }}</summary>
      <div class="margin-bottom">
        <label for="obs-name">{{ t("Change_Name") }}</label>
        <input id="obs-name" type="text" v-model="currentObservation.name" />
      </div>

      <div class="margin-bottom">
        <label for="obs-date">{{ t("Change_Date") }}</label>
        <input
          id="obs-date"
          type="datetime-local"
          @input="currentObservation.date = new Date($event.target.value)"
          :value="inputDate(currentObservation.date)"
        />
      </div>

      <div class="margin-bottom">
        <label for="obs-list">{{ t("Change_List") }}</label>
        <select id="obs-list" @change="updateList($event.target.value)">
          <option value="">{{ t("No_Special_List") }}</option>
          <option
            v-for="{ id, title } in myLists"
            :value="id"
            :key="id"
            :selected="id === currentObservation?.listId && 'selected'"
          >
            {{ title }}
          </option>
        </select>
      </div>
      <div class="margin-bottom">
        <button type="button" class="secondary" @click="saveAndClose($event.target)">{{ t("Save") }}</button>
        <button type="button" @click="deleteAndClose(currentObservation?.id, $event.target)">{{ t("Delete") }}</button>
      </div>
    </details>

    <div v-if="canEdit(currentObservation?.owner)">
      <button type="button" class="secondary" @click="close($event.target)">{{ t("Cancel") }}</button>
    </div>
    <div v-else>
      <button type="button" class="secondary" @click="close($event.target)">{{ t("Close") }}</button>
    </div>
  </dialog>
</template>

<style>
.dialog h2 {
  font-weight: bold;
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

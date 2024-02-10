<script setup>
import { ref } from "vue";
import { useSettingsStore } from '../stores/settings.js'
import { getTiedRealmId } from "dexie-cloud-addon";
import { db } from "../db";

const settingsStore = useSettingsStore()
const { t } = settingsStore

const props = defineProps(["isOpen", "user", "observation", "lists"]);
const emit = defineEmits(["delete", "close"]);

const selectedList = ref(props.observation.listId);
const selectedListRealm = ref(props.observation.realmId);
const currentName = ref(props.observation.name);
const currentDate = ref(props.observation.date);

function canEdit(owner) {
  return owner === "unauthorized" || props.user === owner;
}

function formatDate(date) {
  return new Intl.DateTimeFormat(false, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

function inputDate(date) {
  return new Date(new Date(date).getTime() - new Date(date).getTimezoneOffset() * 60000).toISOString().substring(0, 16);
}

function updateList(val) {
  selectedList.value = val;
  selectedListRealm.value = getTiedRealmId(val);
}

function deleteAndClose(id) {
  emit("delete", id);
  emit("close");
}

async function save() {
  const name = currentName.value.trim();
  const date = currentDate.value;
  const listId = selectedList.value;
  const realmId = selectedListRealm.value;
  const location = props.observation.location;
  await db.transaction("rw", [db.lists, db.observations], async () => {
    // Move list into the realm (if not already there):
    await db.lists.update(listId, { realmId });
    await db.observations.update(props.observation, {
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
</script>

<template>
  <div class="dialog" v-if="props.isOpen">
    <h2>{{ observation.name }}</h2>
    <h3>{{ formatDate(observation.date) }}</h3>
    <p class="margin-bottom">{{ t("By") }}: {{ observation.owner }}</p>
    <div v-if="observation.location" class="margin-bottom">
      <a
        :href="`https://www.openstreetmap.org/#map=16/${observation.location.replace(',', '/')}`"
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

    <details v-if="canEdit(observation.owner)" class="margin-bottom">
      <summary>{{ t("Edit_Observation") }}</summary>
      <div class="margin-bottom">
        <label for="obs-name">{{ t("Change_Name") }}</label>
        <input id="obs-name" type="text" v-model="currentName" />
      </div>

      <div class="margin-bottom">
        <label for="obs-date">{{ t("Change_Date") }}</label>
        <input
          id="obs-date"
          type="datetime-local"
          @input="currentDate = new Date($event.target.value)"
          :value="inputDate(currentDate)"
        />
      </div>

      <div class="margin-bottom">
        <label for="obs-list">{{ t("Change_List") }}</label>
        <select id="obs-list" @change="updateList($event.target.value)">
          <option value="">{{ t("No_Special_List") }}</option>
          <option
            v-for="{ id, title } in lists"
            :value="id"
            :key="id"
            :selected="id === observation.listId && 'selected'"
          >
            {{ title }}
          </option>
        </select>
      </div>
      <div class="margin-bottom">
        <button type="button" class="secondary" @click="saveAndClose">{{ t("Save") }}</button>
        <button type="button" @click="deleteAndClose(observation.id)">{{ t("Delete") }}</button>
      </div>
    </details>

    <div v-if="canEdit(observation.owner)">
      <button type="button" class="secondary" @click="emit('close')">{{ t("Cancel") }}</button>
    </div>
    <div v-else>
      <button type="button" class="secondary" @click="emit('close')">Stäng</button>
    </div>
  </div>
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

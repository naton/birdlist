<script setup>
import { ref } from "vue";
import { db } from "../db";

const props = defineProps(["isOpen", "user", "observation", "lists"]);
const emit = defineEmits(["delete", "close"]);

const selectedList = ref(props.observation.listId);
const currentName = ref(props.observation.name);
const currentDate = ref(props.observation.date);

function canEdit(owner) {
  return props.user !== "unauthorized" && props.user === owner;
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
  return new Date(
    new Date(date).getTime() - new Date(date).getTimezoneOffset() * 60000
  )
    .toISOString()
    .substring(0, 16);
}

function deleteAndClose(id) {
  emit("delete", id);
  emit("close");
}

async function save() {
  const name = currentName.value.trim();
  const date = new Date(currentDate.value);
  const listId = selectedList.value;
  await db.observations.update(props.observation, {
    name,
    date,
    listId,
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
    <h3 class="margin-bottom">{{ formatDate(observation.date) }}</h3>
    <div v-if="observation.location" class="margin-bottom">
      <a
        :href="`https://www.openstreetmap.org/#map=16/${observation.location.replace(
          ',',
          '/'
        )}`"
        target="_blank"
        class="poi"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          width="24"
          height="24"
        >
          <g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M8 15.5s-5.5-5-5.5-9.5a5.5 5.5 0 0 1 11 0 6.883 6.883 0 0 1-.322 2"
            />
            <circle cx="8" cy="6" r="1.5" />
            <path d="m8.5 11.5 2 2 4-4" />
          </g>
        </svg>
        Visa plats på karta
      </a>
    </div>

    <details v-if="canEdit(observation.owner)" class="margin-bottom">
      <summary>Redigera observation</summary>
      <div class="margin-bottom">
        <label for="obs-date">Ändra namn</label>
        <input id="obs-name" type="text" v-model="currentName" />
      </div>

      <div class="margin-bottom">
        <label for="obs-date">Ändra datum</label>
        <input
          id="obs-date"
          type="datetime-local"
          @input="currentDate = $event.target.value"
          :value="inputDate(currentDate)"
        />
      </div>

      <div class="margin-bottom">
        <label for="obs-list">Ändra lista</label>
        <select id="obs-list" @change="selectedList = $event.target.value">
          <option value="">Ingen speciell lista</option>
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
    </details>

    <div v-if="canEdit(observation.owner)">
      <button type="button" class="secondary" @click="saveAndClose">
        Spara
      </button>
      <button type="button" @click="deleteAndClose(observation.id)">
        Radera
      </button>
      <button type="button" class="secondary" @click="emit('close')">
        Avbryt
      </button>
    </div>
    <div v-else>
      <button type="button" class="secondary" @click="emit('close')">
        Stäng
      </button>
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
.dialog input {
  max-width: 90%;
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

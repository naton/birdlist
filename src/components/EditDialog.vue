<script setup>
import { ref } from "vue";
import { db } from "../db";

const props = defineProps(["isOpen", "observation", "lists"]);
const emit = defineEmits(["delete", "close"]);

const selectedList = ref("");
const currentDate = ref(new Date());

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
  const date = new Date(currentDate.value);
  const listId = selectedList.value;
  await db.observations.update(props.observation, {
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
    <h3>{{ formatDate(observation.date) }}</h3>

    <p v-if="observation.location">
      Plats:
      <a
        href="https://www.openstreetmap.org/#map=16/{{ observation.location }}"
        target="_blank"
        >{{ observation.location }}</a
      >
    </p>

    <div>
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

    <div>
      <label for="obs-date">Ändra datum</label>
      <input
        id="obs-date"
        type="datetime-local"
        @input="currentDate = $event.target.value"
        :value="inputDate(observation.date || currentDate)"
      />
    </div>

    <div>
      <button type="button" class="secondary" @click="saveAndClose">
        Spara och stäng
      </button>
      <button type="button" class="secondary" @click="emit('close')">
        Avbryt
      </button>
    </div>

    <div>
      <button type="button" @click="deleteAndClose(observation.id)">
        Radera
      </button>
    </div>
  </div>
</template>

<style scoped>
h2 {
  font-weight: bold;
}

div {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-top: 1rem;
  font-weight: bold;
}

select,
input {
  max-width: 90%;
  font-size: 1.5rem;
}
</style>

<script setup>
import { ref, onUpdated } from "vue";
import { db } from "../db";

const props = defineProps(["isOpen", "observation", "tabList"]);

const emit = defineEmits(["delete", "close"]);

const currentObservation = ref("");
const currentList = ref(null);
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
  const listId = currentList.value;
  await db.observations.update(props.observation, {
    date,
    listId,
  });
}

onUpdated(async () => {
  currentObservation.value = await db.observations.get(props.observation);
});
</script>

<template>
  <dialog :open="props.isOpen" v-if="currentObservation">
    <h2>{{ currentObservation.name }}</h2>
    <h3>{{ formatDate(currentObservation.date) }}</h3>

    <div>
      <label for="obs-list">Ändra lista</label>
      <select id="obs-list" @change="currentList = $event.target.value">
        <option value>Ingen speciell lista</option>
        <option
          v-for="{ id, title } in tabList"
          :value="id"
          :key="id"
          :selected="id == currentObservation.listId"
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
        :value="inputDate(currentDate)"
      />
    </div>

    <div>
      <button type="button" @click="deleteAndClose(currentObservation.id)">
        Radera
      </button>
      <button type="button" class="secondary" @click="save">Spara</button>
      <button type="button" class="secondary" @click="emit('close')">
        Avbryt
      </button>
    </div>
  </dialog>
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

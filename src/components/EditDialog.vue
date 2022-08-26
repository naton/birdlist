<script setup>
import { ref, onUpdated } from "vue";
import { db } from "../db";

const props = defineProps(["isOpen", "observation"]);

const emit = defineEmits(["delete", "close"]);

const currentObservation = ref("");
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

async function updateDate() {
  let date = new Date(currentDate.value);
  await db.observations.update(props.observation, { date });
}

onUpdated(async () => {
  currentObservation.value = await db.observations.get(props.observation);
});
</script>

<template>
  <dialog :open="props.isOpen" v-if="currentObservation">
    <h2>{{ currentObservation.name }}</h2>
    <h3>{{ formatDate(currentObservation.date) }}</h3>
    <label for="obs-date">Ändra datum</label>
    <input
      id="obs-date"
      type="datetime-local"
      @input="currentDate = $event.target.value"
      :value="inputDate(currentDate)"
    />
    <div>
      <button
        type="button"
        @click.prevent="deleteAndClose(currentObservation.id)"
      >
        Radera observation
      </button>
      <button type="button" class="secondary" @click.prevent="updateDate">
        Spara
      </button>
      <button type="button" class="secondary" @click.prevent="emit('close')">
        Stäng
      </button>
    </div>
  </dialog>
</template>

<style scoped>
div {
  margin-top: 1rem;
}

label {
  margin-top: 1rem;
}

input {
  max-width: 90%;
  font-size: 1.5rem;
}
</style>

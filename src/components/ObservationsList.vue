<script setup>
import { ref, computed, onUnmounted } from "vue";
import { liveQuery } from "dexie";
import { db } from "../db";
import TabsList from "@/components/TabsList.vue";
import ThisList from "@/components/ThisList.vue";
import ObservationInput from "@/components/ObservationInput.vue";
import BirdsList from "@/components/BirdsList.vue";

let currentMonth = ref(new Date().getMonth());
let currentSort = ref("bydate");
let currentObservation = ref(0);
let allObservations = ref([]);

const subscription = liveQuery(() => db.observations.toArray()).subscribe(
  (observations) => {
    // Success result:
    allObservations.value = observations;
  },
  (error) => {
    // Error result:
    console.log(error);
  }
);

const activeMonth = computed(() => {
  const date = new Date().setMonth(currentMonth.value);
  return new Intl.DateTimeFormat("sv", {
    year: "numeric",
    month: "long",
  }).format(date);
});

const allThisMonth = computed(() => {
  return allObservations.value.filter(
    (obs) =>
      obs.date.getFullYear() == new Date().getFullYear() &&
      obs.date.getMonth() == currentMonth.value
  );
});

function scrollToBottom(el) {
  document
    .querySelector(el)
    .scrollTo(0, document.querySelector(el).scrollHeight + 40);
}

async function addObservation(ev) {
  try {
    await db.observations.add({
      name: ev.target.value,
      date: new Date(),
    });

    // Reset form field value
    ev.target.value = "";
    // Make sure new value is instantly visible in viewport
    setTimeout(() => {
      scrollToBottom(".body");
    }, 100);
  } catch (error) {
    console.log("Error", error);
  }
}

function selectObservation(id) {
  return (currentObservation.value =
    currentObservation.value == id ? null : id);
}

async function deleteObservation(id) {
  db.observations.delete(id);
}

function sortBy(val) {
  console.log("sort", val);
  return (currentSort.value = val);
}

const tabList = ["Månadskryss", "Alla kryss"];

onUnmounted(() => {
  subscription.unsubscribe();
});
</script>

<template>
  <div class="body">
    <tabs-list :tabList="tabList">
      <template v-slot:tabPanel-1>
        <this-list
          :observations="allThisMonth"
          :month="currentMonth.value"
          :sort="currentSort"
          :selected="currentObservation"
          @sort="sortBy"
          @select="selectObservation"
          @delete="deleteObservation"
        >
          <template v-slot:header>
            <div class="month-nav">
              <button @click.prevent="currentMonth--">«</button>
              <h2 class="subtitle center">
                {{ activeMonth }}
              </h2>
              <button @click.prevent="currentMonth++">»</button>
            </div>
          </template>
        </this-list>
      </template>

      <template v-slot:tabPanel-2>
        <this-list
          :observations="allObservations"
          :selected="currentObservation"
          :sort="currentSort"
          @sort="sortBy"
          @select="selectObservation"
          @delete="deleteObservation"
        >
          <template v-slot:header>
            <div>
              <h2 class="subtitle center">Alla kryss</h2>
            </div>
          </template>
        </this-list>
      </template>
    </tabs-list>
  </div>
  <div class="footer">
    <observation-input @add="addObservation" />
    <birds-list />
  </div>
</template>

<style>
.center {
  text-align: center;
}

.subtitle {
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.3ex;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
</style>

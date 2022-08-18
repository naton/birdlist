<script setup>
import { ref, computed } from "vue";
import AddObservation from "@/components/AddObservation.vue";
import TabsList from "@/components/TabsList.vue";
import ObservationItem from "./ObservationItem.vue";
import BirdsList from "@/components/BirdsList.vue";

let allObservations = ref([]);
const allThisMonth = computed(() =>
  allObservations.value.filter(
    (obs) =>
      obs.date.getFullYear() == new Date().getFullYear() &&
      obs.date.getMonth() == new Date().getMonth()
  )
);
const uniqueThisMonth = computed(() =>
  [...new Set(allThisMonth.value.map((item) => item.name))].sort()
);

const localDate = (date, config) => {
  let lang = document.documentElement.lang || "sv";
  let options = config ? config : { dateStyle: "full", timeStyle: "short" };
  return new Intl.DateTimeFormat(lang, options).format(date);
};
const tabList = ref([
  `Alla`,
  `${localDate(new Date(), { year: "numeric", month: "long" })}`,
]);

let db = ref(null).value;

const getObservations = () => {
  let transaction = db.transaction("observations", "readonly");
  let observations = transaction.objectStore("observations");
  let request = observations.getAll();

  request.onsuccess = () => {
    allObservations.value = request.result || [];
  };
};

const addObservation = (ev) => {
  let transaction = db.transaction("observations", "readwrite");
  let observations = transaction.objectStore("observations");
  let observation = {
    id: Math.random(),
    name: ev.target.value,
    date: new Date(),
  };
  let addRequest = observations.add(observation);

  addRequest.onsuccess = () => {
    allObservations.value.push(observation);
    ev.target.value = ""; // reset form field value
  };

  addRequest.onerror = () => {
    console.log("Error", addRequest.error);
  };
};

const deleteObservation = (id) => {
  let transaction = db.transaction("observations", "readwrite");
  let observations = transaction.objectStore("observations");
  let getRequest = observations.getKey(id);

  getRequest.onsuccess = () => {
    let id = getRequest.result;
    let deleteRequest = observations.delete(id);
    deleteRequest.onsuccess = () => {
      getObservations();
    };
  };
};

// Indexed DB stuff
let openRequest = indexedDB.open("birdlist", 1);

openRequest.onupgradeneeded = () => {
  // triggers if the client had no database
  db = openRequest.result;
  if (!db.objectStoreNames.contains("observations")) {
    // if there's no "observations" store
    db.createObjectStore("observations", { keyPath: "id" }); // create it
  }
};

openRequest.onerror = () => {
  console.error("Error", openRequest.error);
};

openRequest.onsuccess = () => {
  db = openRequest.result;

  db.onversionchange = () => {
    db.close();
    alert("Database is outdated, please reload the page.");
  };

  getObservations();
};
</script>

<template>
  <div class="body">
    <tabs-list :tabList="tabList">
      <template v-slot:tabPanel-1>
        <ol>
          <ObservationItem
            v-for="item in allObservations"
            :item="item"
            :key="item.id"
            @delete="deleteObservation"
          ></ObservationItem>
        </ol>
      </template>

      <template v-slot:tabPanel-2>
        <ol>
          <ObservationItem
            v-for="item in allThisMonth"
            :item="item"
            :key="item.id"
          ></ObservationItem>
        </ol>

        <h3>{{ uniqueThisMonth.length }} st unika:</h3>
        <ol>
          <ObservationItem
            v-for="(item, index) in uniqueThisMonth"
            :item="item"
            :key="index"
          ></ObservationItem>
        </ol>
      </template>
    </tabs-list>
  </div>
  <div class="footer">
    <AddObservation @add="addObservation" />
    <BirdsList />
  </div>
</template>

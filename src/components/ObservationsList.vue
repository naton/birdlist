<script setup>
import { ref, computed } from "vue";
import AddObservation from "@/components/AddObservation.vue";
import TabsList from "@/components/TabsList.vue";
import ObservationItem from "./ObservationItem.vue";
import BirdsList from "@/components/BirdsList.vue";

let allObservations = ref([]);
let currentMonth = ref(new Date().getMonth());

const allThisMonth = computed(() =>
  allObservations.value.filter(
    (obs) =>
      obs.date.getFullYear() == new Date().getFullYear() &&
      obs.date.getMonth() == currentMonth.value
  )
);

const uniqueThisMonth = computed(() =>
  [...new Set(allThisMonth.value.map((item) => item.name))].sort()
);

const currentDate = computed(() => {
  const date = new Date().setMonth(currentMonth.value);
  return new Intl.DateTimeFormat("sv", {
    year: "numeric",
    month: "long",
  }).format(date);
});

const scrollToBottom = (el) => {
  document
    .querySelector(el)
    .scrollTo(0, document.querySelector(el).scrollHeight + 20);
};

const tabList = ref(["Månadskryss", "Alla observationer"]);

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
    setTimeout(() => {
      scrollToBottom(".body");
    }, 100);
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
        <div class="month-nav">
          <button @click="currentMonth--">«</button>
          <h2>
            {{ currentDate }}
          </h2>
          <button @click="currentMonth++">»</button>
        </div>
        <ul>
          <ObservationItem
            v-for="item in allThisMonth"
            :item="item"
            :key="item.id"
            :show_date="true"
            @delete="deleteObservation"
          ></ObservationItem>
        </ul>

        <details>
          <summary>Totalt {{ uniqueThisMonth.length }} st unika:</summary>
          <ol>
            <ObservationItem
              v-for="(item, index) in uniqueThisMonth"
              :item="item"
              :key="index"
            ></ObservationItem>
          </ol>
        </details>
      </template>

      <template v-slot:tabPanel-2>
        <ol>
          <ObservationItem
            v-for="item in allObservations"
            :item="item"
            :key="item.id"
            @delete="deleteObservation"
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

<style scoped>
ol,
ul {
  padding: 0;
}

h3 {
  text-align: center;
}

details {
  margin-top: 2rem;
}
.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.3ex;
}
</style>

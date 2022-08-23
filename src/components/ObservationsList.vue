<script setup>
import { toRefs, reactive, computed, onUnmounted } from "vue";
import { liveQuery } from "dexie";
import { db } from "../db";
import AddObservation from "@/components/AddObservation.vue";
import TabsList from "@/components/TabsList.vue";
import ObservationItem from "./ObservationItem.vue";
import BirdsList from "@/components/BirdsList.vue";

const current = reactive({ month: new Date().getMonth(), sort: "bydate" });
const data = reactive({ observations: [], observationsError: null });
const queryRefs = toRefs(data);
const subscription = liveQuery(() => db.observations.toArray()).subscribe(
  (observations) => {
    // Success result:
    queryRefs.observations.value = observations;
    queryRefs.observationsError.value = null;
  },
  (error) => {
    // Error result:
    queryRefs.observationsError.value = error;
  }
);

onUnmounted(() => {
  subscription.unsubscribe();
});

const allThisMonth = computed(() => {
  return data.observations.filter(
    (obs) =>
      obs.date.getFullYear() == new Date().getFullYear() &&
      obs.date.getMonth() == current.month
  );
});

const uniqueThisMonth = computed(() =>
  [...new Set(allThisMonth.value.map((item) => item.name))].sort()
);

const activeMonth = computed(() => {
  const date = new Date().setMonth(current.month);
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

const tabList = ["Månadskryss", "Alla observationer"];

const addObservation = async (ev) => {
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
};

const deleteObservation = async (id) => {
  db.observations.delete(id);
};
</script>

<template>
  <div class="body">
    <tabs-list :tabList="tabList">
      <template v-slot:tabPanel-1>
        <div class="month-nav">
          <button @click="current.month--">«</button>
          <h2>
            {{ activeMonth }}
          </h2>
          <button @click="current.month++">»</button>
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
            v-for="item in data.observations"
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

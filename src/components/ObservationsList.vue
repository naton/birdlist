<script setup>
import { toRefs, reactive, computed, onUnmounted } from "vue";
import { liveQuery } from "dexie";
import { db } from "../db";
import TabsList from "@/components/TabsList.vue";
import ObservationItem from "./ObservationItem.vue";
import ObservationInput from "@/components/ObservationInput.vue";
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
    .scrollTo(0, document.querySelector(el).scrollHeight + 40);
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
          <h2 class="subtitle center">
            {{ activeMonth }}
          </h2>
          <button @click="current.month++">»</button>
        </div>

        <nav class="nav" v-if="allThisMonth.length">
          <a
            href="#bydate"
            @click.prevent="current.sort = 'bydate'"
            :style="{
              fontWeight: current.sort == 'bydate' ? 'bold' : 'normal',
            }"
            >Datum</a
          >
          <a
            href="#byname"
            @click.prevent="current.sort = 'byname'"
            :style="{
              fontWeight: current.sort == 'byname' ? 'bold' : 'normal',
            }"
            >Namn</a
          >
        </nav>

        <section
          id="bydate"
          v-show="current.sort == 'bydate'"
          v-if="allThisMonth.length"
        >
          <h3 class="center">{{ allThisMonth.length }} observationer</h3>
          <ul>
            <observation-item
              v-for="item in allThisMonth"
              :item="item"
              :key="item.id"
              :show_date="true"
              @delete="deleteObservation"
            ></observation-item>
          </ul>
        </section>

        <section
          id="byname"
          v-show="current.sort == 'byname'"
          v-if="allThisMonth.length"
        >
          <h3 class="center">{{ uniqueThisMonth.length }} olika arter</h3>
          <ol>
            <observation-item
              v-for="(item, index) in uniqueThisMonth"
              :item="item"
              :key="index"
            ></observation-item>
          </ol>
        </section>

        <section v-else>
          <h3 class="center">Inga observationer denna månad</h3>
        </section>
      </template>

      <template v-slot:tabPanel-2>
        <h2 class="subtitle center">I alfabetisk ordning</h2>
        <ol>
          <observation-item
            v-for="item in data.observations"
            :item="item"
            :key="item.id"
            @delete="deleteObservation"
          ></observation-item>
        </ol>
      </template>
    </tabs-list>
  </div>
  <div class="footer">
    <observation-input @add="addObservation" />
    <birds-list />
  </div>
</template>

<style scoped>
ol,
ul {
  margin-top: 0.5rem;
  padding: 0;
}

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
.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>

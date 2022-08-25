<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { liveQuery } from "dexie";
import { db } from "../db";
import TabsList from "@/components/TabsList.vue";
import ThisList from "@/components/ThisList.vue";
import ObservationInput from "@/components/ObservationInput.vue";
import BirdsData from "@/components/BirdsData.vue";

defineProps(["title"]);

let currentMonth = ref(new Date().getMonth());
let currentSort = ref("bydate");
let currentTab = ref("monthly");
let currentListName = ref("");
let currentObservation = ref(0);
let allObservations = ref([]);
let tabList = ref([]);
let isListSelected = ref(false);

const observationsSubscription = liveQuery(() =>
  db.observations.toArray()
).subscribe(
  (observations) => {
    // Success result:
    allObservations.value = observations;
  },
  (error) => {
    // Error result:
    console.log(error);
  }
);

const listsSubscription = liveQuery(() => db.lists.toArray()).subscribe(
  (lists) => {
    // Success result:
    tabList.value = lists;
  },
  (error) => {
    // Error result:
    console.log(error);
  }
);

const currentMonthFormatted = computed(() => {
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

const listObservations = computed(() => {
  return allObservations.value.filter((obs) => obs.listId == currentTab.value);
});

function scrollToBottom(el) {
  document
    .querySelector(el)
    .scrollTo(0, document.querySelector(el).scrollHeight + 40);
}

function sortBy(val) {
  return (currentSort.value = val);
}

async function addObservation(ev, activeTab) {
  try {
    await db.observations.add({
      listId:
        activeTab == "monthly" || activeTab == "everything"
          ? undefined
          : activeTab, // Any ID other than defaults are valid here
      realmId: "anton@andreasson.org", // TODO: Make this dynamic
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
  currentObservation.value = currentObservation.value == id ? 0 : id;
}

async function deleteObservation(id) {
  db.observations.delete(id);
}

async function deleteList(id) {
  if (
    confirm(
      "Är du säker på att du vill ta bort denna lista och alla dess observationer?"
    )
  ) {
    db.lists.delete(id);
    db.observations
      .where("listId")
      .equalsIgnoreCase(id)
      .delete()
      .then(function (deleteCount) {
        console.log("Deleted " + deleteCount + " objects");
        setTab("monthly");
      });
  }
}

function setTab(id, title) {
  currentTab.value = id;
  currentListName.value = title;
}

function getSlotName(tab) {
  return `tabPanel-${tab}`;
}

onMounted(() => {
  setTab("monthly");
});

onUnmounted(() => {
  observationsSubscription.unsubscribe();
  listsSubscription.unsubscribe();
});
</script>

<template>
  <div class="body">
    <tabs-list :tabList="tabList" :tab="currentTab" @activate="setTab">
      <template v-slot:[getSlotName(currentTab)]>
        <div class="body-content">
          <this-list
            v-if="currentTab === 'monthly'"
            :observations="allThisMonth"
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
                  {{ currentMonthFormatted }}
                </h2>
                <button @click.prevent="currentMonth++">»</button>
              </div>
            </template>
          </this-list>

          <this-list
            v-else-if="currentTab === 'everything'"
            :observations="allObservations"
            :selected="currentObservation"
            :sort="currentSort"
            @sort="sortBy"
            @select="selectObservation"
            @delete="deleteObservation"
          >
            <template v-slot:header>
              <div class="list-header">
                <h2 class="subtitle center">Alla kryss</h2>
              </div>
            </template>
          </this-list>

          <this-list
            v-else
            :observations="listObservations"
            :selected="currentObservation"
            :sort="currentSort"
            @sort="sortBy"
            @select="selectObservation"
            @delete="deleteObservation"
          >
            <template v-slot:header>
              <div
                class="list-header"
                :class="isListSelected && 'is-active'"
                @click="isListSelected = !isListSelected"
              >
                <h2 class="subtitle">{{ currentListName || "Egen lista" }}</h2>
                <button @click.prevent="deleteList(currentTab)">x</button>
              </div>
            </template>
          </this-list>
        </div>
      </template>
    </tabs-list>
  </div>
  <div class="footer">
    <observation-input @add="addObservation" :tab="currentTab" />
    <birds-data />
  </div>
</template>

<style>
.body-nav {
  grid-area: body-nav;
  display: flex;
  max-width: 100vw;
  overflow: hidden;
  background: var(--color-background-dim);
}

.body-content {
  grid-area: body-content;
  overflow: auto;
}

.list-header {
  overflow: hidden;
}

.is-active.list-header {
  position: relative;
}

.list-header .subtitle {
  display: flex;
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 1rem;
  background: var(--color-background);
  transition: 0.1s transform ease-out;
}

.is-active.list-header .subtitle {
  background: var(--color-background-dim);
  transform: translateX(-3rem);
}

.list-header button {
  position: absolute;
  right: 0;
  top: 0.5rem;
  z-index: -1;
  transform: translateX(3rem);
  transition: 0.1s transform ease-out;
  z-index: 0;
}

.is-active.list-header button {
  transform: translateX(0);
}
</style>

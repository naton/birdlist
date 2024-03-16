<script setup>
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from 'pinia'
import { liveQuery } from "dexie";
import { db } from "../db";
import TabsList from "@/components/TabsList.vue";
import CustomList from "@/views/lists/CustomList.vue";
import YearlyList from "@/views/lists/YearlyList.vue";
import MonthlyList from "@/views/lists/MonthlyList.vue";
import { getCurrentYear, getMonthName } from "../helpers";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from '../stores/lists.js'
import { useObservationsStore } from '../stores/observations.js'

const settingsStore = useSettingsStore()
const { currentYear, currentMonth } = storeToRefs(settingsStore)

const listsStore = useListsStore()
const { currentList } = storeToRefs(listsStore)

const observationsStore = useObservationsStore()
const { allListObservations, allThisMonth, allMyObservations } = storeToRefs(observationsStore)

const emit = defineEmits(["openDialog", "selectList", "newLeader"]);

const allComments = ref([]);

/* Comments */
liveQuery(async () => await db.comments.toArray()).subscribe(
  (comments) => {
    allComments.value = comments;
  },
  (error) => {
    console.log(error);
  }
);

const listComments = computed(() => {
  const listId = currentList.id;
  return allComments.value.filter((comment) => comment.listId == listId);
});

function selectList(list) {
  emit("selectList", list);

  if (list === "monthly" || list === "everything") {
    document.location.hash = "";
  }
}

function newLeader() {
  emit("newLeader");
}

/* Other */
function getSlotName(id) {
  return `tabPanel-${id}`;
}

onMounted(() => {
  emit("selectList", "monthly");
});
</script>

<template>
  <tabs-list
    :monthLabel="getMonthName(currentMonth, 'long')"
    :yearLabel="getCurrentYear(currentYear)"
    @activate="selectList"
  >
    <template v-slot:[getSlotName(currentList.id)]>
      <div class="body-content">
        <monthly-list v-if="currentList.id === 'monthly'"
          :observations="allThisMonth"
        ></monthly-list>
        <yearly-list v-else-if="currentList.id === 'everything'"
          :observations="allMyObservations"
        ></yearly-list>
        <custom-list v-else
          :observations="allListObservations"
          @new-leader="newLeader"
          ></custom-list>
      </div>
    </template>
  </tabs-list>
</template>

<style>
.list-header {
  position: relative;
  overflow: hidden;
  padding: 0.25rem 0;
}

.list-description,
.list-owner {
  margin: 0 0.5rem 1rem;
}

.list-owner {
  font-size: 0.9rem;
}

.sidescroll {
  overflow-x: auto;
  padding: 0 0.8rem;
}

.date-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prev-date {
  margin-left: 1rem;
}

.next-date {
  margin-right: 1rem;
}

.year-summary {
  margin: 0 auto 1rem;
  font-size: 0.9rem;
}

.month-button {
  min-width: 2rem;
  padding: 0.5rem;
}

.list-header .subtitle {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 1rem;
  background: var(--color-background);
  transition: 0.1s transform ease-out;
}

.list-header button {
  min-height: 2.3rem;
}

.list-header .notify-button {
  margin-top: 0.3rem;
}

.list-header .share-button {
  align-self: center;
  margin-left: 0.5rem;
  white-space: nowrap;
}

.notify-button svg {
  width: 20px;
  vertical-align: middle;
}

.share-button svg {
  width: 16px;
  margin-right: 0.4rem;
  vertical-align: text-top;
}
</style>

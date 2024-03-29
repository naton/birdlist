<script setup>
import { computed, onMounted } from "vue";
import { storeToRefs } from 'pinia'
import TabsList from "@/components/TabsList.vue";
import YearlyList from "@/views/lists/YearlyList.vue";
import MonthlyList from "@/views/lists/MonthlyList.vue";
import { getCurrentYear, getMonthName } from "../helpers";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from '../stores/lists.js'
import { useObservationsStore } from '../stores/observations.js'
import { useCommentsStore } from "@/stores/comments.js";

const settingsStore = useSettingsStore()
const { currentYear, currentMonth } = storeToRefs(settingsStore)

const listsStore = useListsStore()
const { currentList } = storeToRefs(listsStore)

const observationsStore = useObservationsStore()
const { allThisMonth, allMyObservations } = storeToRefs(observationsStore)

const commentsStore = useCommentsStore()
const { allComments } = storeToRefs(commentsStore)

const emit = defineEmits(["edit", "selectList", "newLeader"]);

/* Comments */
const listComments = computed(() => {
  const listId = currentList.id;
  return listId ? allComments.value?.filter((comment) => comment.listId == listId) : [];
});

function edit() {
  emit("edit");
}

function selectList(list) {
  emit("selectList", list);

  if (list === "monthly" || list === "everything") {
    document.location.hash = "";
  }
}

function newLeader() {
  emit("newLeader");
}

onMounted(() => {
  emit("selectList", "monthly");
});
</script>

<template>
  <tabs-list :monthLabel="getMonthName(currentMonth, 'long')" :yearLabel="getCurrentYear(currentYear)" @activate="selectList">
    <template v-slot:[`tabPanel-${currentList.id}`]>
      <div class="body-content">
        <monthly-list v-if="currentList.id === 'monthly'" :observations="allThisMonth" @edit="edit"></monthly-list>
        <yearly-list v-else-if="currentList.id === 'everything'" :observations="allMyObservations" @activate="selectList" @edit="edit"></yearly-list>
      </div>
    </template>
  </tabs-list>
</template>

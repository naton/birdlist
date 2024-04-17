<script setup>
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useListsStore } from "@/stores/lists.js";
import NavTabs from "@/components/NavTabs.vue";
import NormalList from "@/components/NormalList.vue";

const emit = defineEmits(["sort", "edit"]);

const settingsStore = useSettingsStore();
const { prevMonth, nextMonth } = settingsStore;
const { currentMonthFormatted } = storeToRefs(settingsStore);

const observationsStore = useObservationsStore();
const { allThisMonth } = storeToRefs(observationsStore);

const listsStore = useListsStore();
const { sortBy } = listsStore;
const { currentSort } = storeToRefs(listsStore);

function edit(obs) {
  emit("edit", obs)
}
</script>

<template>
  <nav-tabs></nav-tabs>

  <div class="body-content">
    <normal-list
      :observations="allThisMonth"
      :sort="currentSort === 'comments' ? 'bydate' : currentSort"
      @sort="sortBy"
      @edit="edit"
    >
      <template v-slot:header>
        <div class="list-header date-nav">
          <button class="prev-date" @click.prevent="prevMonth">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
              <path
                fill="currentColor"
                d="m9.854 1.646-1.5-1.5a.5.5 0 0 0-.708 0l-5.5 5.5a.5.5 0 0 0 0 .708l5.5 5.5a.5.5 0 0 0 .708 0l1.5-1.5a.5.5 0 0 0 0-.708L6.207 6l3.647-3.646a.5.5 0 0 0 0-.708Z"
              />
            </svg>
          </button>
          <h1 class="heading center">{{ currentMonthFormatted }}</h1>
          <button class="next-date" @click.prevent="nextMonth">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
              <path
                fill="currentColor"
                d="m2.146 10.354 1.5 1.5a.5.5 0 0 0 .708 0l5.5-5.5a.5.5 0 0 0 0-.708l-5.5-5.5a.5.5 0 0 0-.708 0l-1.5 1.5a.5.5 0 0 0 0 .708L5.793 6 2.146 9.646a.5.5 0 0 0 0 .708Z"
              />
            </svg>
          </button>
        </div>
      </template>
    </normal-list>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useSettingsStore } from "@/stores/settings.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useListsStore } from "@/stores/lists.js";
import { getMonthName } from "@/helpers";
import NavTabs from "@/components/NavTabs.vue";
import NormalList from "@/components/NormalList.vue";

const emit = defineEmits(["openDialog", "sort", "edit"]);

const router = useRouter();

const settingsStore = useSettingsStore();
const { currentYear, currentMonth } = storeToRefs(settingsStore);

const observationsStore = useObservationsStore();
const { allMyObservations } = storeToRefs(observationsStore);
const { getTotalPerMonth } = observationsStore;

const listsStore = useListsStore();
const { sortBy } = listsStore;
const { currentSort } = storeToRefs(listsStore);

function edit(obs) {
  emit("edit", obs)
}

function goToMonth(month) {
  currentMonth.value = month;
  router.push({ name: "monthly" });
}
</script>

<template>
  <nav-tabs></nav-tabs>

  <div class="body-content">
    <normal-list
      :observations="allMyObservations"
      :sort="currentSort === 'comments' ? 'bydate' : currentSort"
      @sort="sortBy"
      @edit="edit"
    >
      <template v-slot:header>
        <div class="list-header date-nav">
          <button class="prev-date" @click.prevent="currentYear--">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
              <path
                fill="currentColor"
                d="m9.854 1.646-1.5-1.5a.5.5 0 0 0-.708 0l-5.5 5.5a.5.5 0 0 0 0 .708l5.5 5.5a.5.5 0 0 0 .708 0l1.5-1.5a.5.5 0 0 0 0-.708L6.207 6l3.647-3.646a.5.5 0 0 0 0-.708Z"
              />
            </svg>
          </button>
          <h1 class="heading center">{{ currentYear }}</h1>
          <button class="next-date" @click.prevent="currentYear++">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
              <path
                fill="currentColor"
                d="m2.146 10.354 1.5 1.5a.5.5 0 0 0 .708 0l5.5-5.5a.5.5 0 0 0 0-.708l-5.5-5.5a.5.5 0 0 0-.708 0l-1.5 1.5a.5.5 0 0 0 0 .708L5.793 6 2.146 9.646a.5.5 0 0 0 0 .708Z"
              />
            </svg>
          </button>
        </div>
        <div class="center sidescroll">
          <table class="year-summary">
            <tbody>
              <tr>
                <td v-for="n in 12" :key="n">
                  {{ getMonthName(n - 1) }}
                </td>
              </tr>
              <tr>
                <td v-for="n in 12" :key="n">
                  <button
                    class="month-button"
                    :class="getTotalPerMonth(n - 1) == '0' && 'secondary'"
                    @click="goToMonth(n - 1)"
                  >
                    {{ getTotalPerMonth(n - 1) }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </normal-list>
  </div>
</template>

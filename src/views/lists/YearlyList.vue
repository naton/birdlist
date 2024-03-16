<script setup>
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";
import { useObservationsStore } from "@/stores/observations.js";
import { getMonthName } from "@/helpers";
import ListView from "@/components/ListView.vue";

const props = defineProps(["observations"]);
const emit = defineEmits(["openDialog", "selectList", "sort", "edit"]);

const settingsStore = useSettingsStore();
const { currentUser, currentYear } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const { sortBy } = listsStore;
const { currentSort } = storeToRefs(listsStore);

const observationsStore = useObservationsStore();
const { editObservation } = observationsStore;

function goToMonth(month) {
  currentMonth.value = month;
  emit("selectList", "monthly");
}

function totalPerMonth(month) {
  return props.observations.filter(
    (obs) =>
      (obs.owner == currentUser.value?.name || obs.owner == "unauthorized") &&
      obs.date.getFullYear() == currentYear.value &&
      obs.date.getMonth() == month
  ).length;
}
</script>

<template>
  <list-view
    :observations="props.observations"
    :sort="currentSort"
    @sort="sortBy"
    @edit="editObservation"
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
        <h2 class="heading center">{{ currentYear }}</h2>
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
                  :class="totalPerMonth(n - 1) == '0' && 'secondary'"
                  @click="goToMonth(n - 1)"
                >
                  {{ totalPerMonth(n - 1) }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </list-view>
</template>

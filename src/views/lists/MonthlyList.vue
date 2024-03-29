<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";
import ObservationList from "@/components/ObservationList.vue";

const props = defineProps(["observations"]);
const emit = defineEmits(["openDialog", "sort", "edit"]);

const settingsStore = useSettingsStore();
const { currentYear, currentMonth } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const { sortBy } = listsStore;
const { currentSort } = storeToRefs(listsStore);

function edit() {
  emit("edit")
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentYear.value--;
    currentMonth.value = 11;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentYear.value++;
    currentMonth.value = 0;
  } else {
    currentMonth.value++;
  }
}

const currentMonthFormatted = computed(() => {
  const date = new Date().setFullYear(currentYear.value, currentMonth.value);
  return new Intl.DateTimeFormat("sv", {
    year: "numeric",
    month: "long",
  }).format(date);
});
</script>

<template>
  <observation-list
    :observations="props.observations"
    :sort="currentSort"
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
        <h2 class="heading center">
          {{ currentMonthFormatted }}
        </h2>
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
  </observation-list>
</template>

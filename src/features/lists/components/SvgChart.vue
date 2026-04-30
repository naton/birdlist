<script setup>
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useSettingsStore } from "@/stores/settings.js";
import { cssColor, groupBy } from "@/helpers";
import SvgChartLine from "./SvgChartLine.vue";

const settingsStore = useSettingsStore();
const { currentUser, selectedUser } = storeToRefs(settingsStore);

const emit = defineEmits(["newLeader"]);
const props = defineProps({
  observations: {
    type: Array,
    default: () => [],
  },
  users: {
    type: Array,
    default: () => [],
  },
  currentLeader: {
    type: String,
    default: "",
  },
});

const chartWrapper = ref(null);
const svg = reactive({
  w: 300,
  h: 160,
});
const viewbox = computed(() => `0 0 ${svg.w} ${svg.h}`);
const options = reactive({
  xMin: 0,
  xMax: 1,
  yMin: 0,
  yMax: 10,
  line: {
    smoothing: 0.05,
    flattening: 0.05,
  },
});

function selectedClass(name) {
  return name === selectedUser.value ? "selected" : null;
}

function toDateKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

const sortedObservations = computed(() => {
  return [...props.observations].sort((a, b) => new Date(a.date) - new Date(b.date));
});

const observationsByDate = computed(() => {
  return groupBy(sortedObservations.value, (observation) => toDateKey(observation.date));
});

const datasets = computed(() => {
  if (!sortedObservations.value.length || !props.users.length) {
    options.xMax = 1;
    options.yMax = 10;
    return [];
  }

  options.yMax = Math.max(1, ...props.users.map((user) => user.score || 0));
  const firstObsDate = new Date(sortedObservations.value[0].date);
  const lastObsDate = new Date(sortedObservations.value[sortedObservations.value.length - 1].date);
  const datesDiff = Math.max(1, Math.ceil((lastObsDate - firstObsDate) / (1000 * 60 * 60 * 24)));
  options.xMax = datesDiff;
  const datesWithObservations = Object.keys(observationsByDate.value);

  function createGraphData(owner) {
    const values = [];
    let currentValue = 0;
    const day = new Date(firstObsDate);

    for (let days = 0; days <= datesDiff; days++) {
      const obsDate = day.toISOString().slice(0, 10);
      if (datesWithObservations.includes(obsDate)) {
        currentValue += observationsByDate.value[obsDate].filter((obs) => obs.owner === owner).length;
        values.push([days, currentValue]);
      }
      day.setDate(day.getDate() + 1);
    }

    return values;
  }

  return props.users.map((user) => ({
    name: user.name,
    colors: {
      path: cssColor(user.name),
      circles: "var(--color-text-dim)",
    },
    values: createGraphData(user.name),
  }));
});

function resize() {
  if (!datasets.value.length || !chartWrapper.value) {
    return;
  }

  svg.w = chartWrapper.value.offsetWidth;
}

watch(
  datasets,
  () => {
    resize();
  },
  { deep: true, flush: "post" }
);

watch(
  () => props.currentLeader,
  (newLeader, previousLeader) => {
    if (
      previousLeader &&
      newLeader !== previousLeader &&
      props.users.length > 1 &&
      newLeader === currentUser.value?.name
    ) {
      emit("newLeader");
    }
  }
);

onMounted(() => {
  resize();
  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
});
</script>

<template>
  <div ref="chartWrapper" class="chart-wrapper">
    <svg :viewBox="viewbox" class="chart">
      <svg-chart-line
        v-for="dataset in datasets"
        :key="dataset.name"
        :d="dataset"
        :o="options"
        :svg="svg"
        :class="selectedClass(dataset.name)"
      />
    </svg>
  </div>
</template>

<style>
.chart {
  width: 100%;
  height: 160px;
}
</style>

<script setup>
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settings.js';
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { cssColor, groupBy } from "@/helpers";
import SvgChartLine from './SvgChartLine.vue';

const settingsStore = useSettingsStore();
const { currentUser, selectedUser } = storeToRefs(settingsStore);

const emit = defineEmits(["newLeader"]);
const props = defineProps(["observations", "users", "currentLeader"]);
const svg = reactive({
  w: 300,
  h: 160,
});
const viewbox = computed(() => `0 0 ${svg.w} ${svg.h}`);
const datasets = ref([]);
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
const leader = ref(null);

function selectedClass(name) {
  return name === selectedUser.value ? "selected" : null;
}

function toDateKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

const sortedObservations = computed(() => {
  return [...(props.observations || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
});

const observationsByDate = computed(() => {
  return groupBy(sortedObservations.value, (observation) => toDateKey(observation.date));
});

function resize() {
  if (datasets.value.length > 0) {
    const chart = document.querySelector(".chart-wrapper");
    if (!chart) {
      return;
    }
    svg.w = chart.offsetWidth;
  }
}

function initGraph() {
  if (!sortedObservations.value.length || !props.users?.length) {
    datasets.value = [];
    return;
  }

  options.yMax = Math.max(1, ...props.users.map((user) => user.score || 0));
  const firstObsDate = new Date(sortedObservations.value[0].date);
  const lastObsDate = new Date(sortedObservations.value[sortedObservations.value.length - 1].date);
  const datesDiff = Math.max(1, Math.ceil((lastObsDate - firstObsDate) / (1000 * 60 * 60 * 24)));
  options.xMax = datesDiff;
  const datesWithObservations = Object.keys(observationsByDate.value);
  let graphData = [];

  function createGraphData(owner) {
    let values = [];
    let currentValue = 0;
    let day = new Date(firstObsDate);

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

  props.users.forEach((user) => {
    graphData.push({
      name: user.name,
      colors: {
        path: cssColor(user.name),
        circles: "var(--color-text-dim)",
      },
      values: createGraphData(user.name),
    });
  });

  datasets.value = graphData;
  resize();
}

watch(leader, (newLeader) => {
  initGraph();
  // Announce new leader only if you’re not alone
  if (props.users.length > 1 && newLeader === currentUser.value?.name) {
    emit("newLeader");
  }
});

watch(
  () => [props.observations, props.users, props.currentLeader],
  () => {
    leader.value = props.currentLeader;
    initGraph();
  },
  { deep: true }
);

onMounted(() => {
  leader.value = props.currentLeader;
  initGraph();
  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
});
</script>

<template>
  <div class="chart-wrapper">
    <svg :viewBox="viewbox" class="chart">
      <svg-chart-line :d="dataset" :o="options" :svg="svg" :class="selectedClass(dataset.name)" v-for="dataset in datasets" :key="dataset.name"></svg-chart-line>
    </svg>
  </div>
</template>

<style>
.chart {
  width: 100%;
  height: 160px;
}
</style>

<script setup>
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settings.js';
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { cssColor, groupBy } from "@/helpers";
import SvgChartLine from './SvgChartLine.vue';

const settingsStore = useSettingsStore();
const { currentUser, selectedUser } = storeToRefs(settingsStore);

const emit = defineEmits(["newLeader"]);
const props = defineProps(["observations", "users", "currentLeader"]);
const svg = reactive({
  w: 300,
  h: 200,
});
const viewbox = computed(() => `0 0 ${svg.w} ${svg.h}`);
const datasets = ref([]);
const options = reactive({
  xMin: 0,
  xMax: window.screen.availWidth,
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

const observationsByDate = computed(() => {
  return groupBy(props.observations, "date");
});

function resize() {
  if (datasets.value.length > 1) {
    const chart = document.querySelector(".chart-wrapper");
    svg.w = chart.offsetWidth;
  }
}

function initGraph() {
  if (!props.observations) {
    return;
  }

  options.yMax = props.users[0].score;
  const firstObsDate = new Date(props.observations[props.observations.length - 1].date);
  const lastObsDate = new Date(props.observations[0].date);
  const datesDiff = parseInt((lastObsDate - firstObsDate) / (1000 * 60 * 60 * 24), 10);
  const graphWidthOfEachDay = Math.ceil(options.xMax / datesDiff);
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
        values.push([days * graphWidthOfEachDay, currentValue]);
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

onMounted(() => {
  leader.value = props.currentLeader;
  window.addEventListener("resize", resize);
});
</script>

<template>
  <div class="chart-wrapper">
    <svg :view-box.camel="viewbox" class="chart">
      <svg-chart-line :d="dataset" :o="options" :svg="svg" :class="selectedClass(dataset.name)" v-for="dataset in datasets" :key="dataset.name"></svg-chart-line>
    </svg>
  </div>
</template>

<style>
.chart {
  width: 100%;
  height: 200px;
}
</style>
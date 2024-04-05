<script setup>
import { computed } from 'vue';
import SvgChartLine from './SvgChartLine.vue';

const props = defineProps(["datasets", "options", "svg", "user"]);
const viewbox = computed(() => `0 0 ${props.svg.w} ${props.svg.h}`);

function selectedClass(name) {
  return name === props.user ? "selected" : null;
};
</script>

<template>
  <div class="chart-wrapper">
    <svg :view-box.camel="viewbox" class="chart">
      <svg-chart-line :d="dataset" :o="options" :svg="props.svg" :class="selectedClass(dataset.name)" v-for="dataset in datasets"></svg-chart-line>
    </svg>
  </div>
</template>

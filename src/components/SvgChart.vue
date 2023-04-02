<script setup>
import { reactive, computed } from 'vue';
import SvgChartLine from './SvgChartLine.vue';

const props = defineProps(["datasets", "options", "svg"]);
const viewbox = computed(() => `0 0 ${props.svg.w} ${props.svg.h}`);
</script>

<template>
  <svg :view-box.camel="viewbox">
    <svg-chart-line :d="dataset" :o="options" :svg="props.svg" v-for="dataset in datasets"></svg-chart-line>
  </svg>
</template>

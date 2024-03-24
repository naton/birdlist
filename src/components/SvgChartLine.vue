<script setup>
import { computed } from 'vue';

const props = defineProps(["d", "o", "svg"]);

const lib = {
  map(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin
  },
  range(start, end, tick) {
    const s = Math.round(start / tick) * tick
    return Array.from({
      length: Math.floor((end - start) / tick)
    }, (v, k) => {
      return k * tick + s
    });
  }
};

const styles = computed(() => {
  return {
    path: {
      fill: props.d.colors.path,
      stroke: props.d.colors.path,
      strokeWidth: 1.5,
      fillOpacity: 0.25,
      strokeOpacity: 0.8
    },
    circles: {
      fill: props.d.colors.circles
    }
  }
});

const pathD = computed(() => {
  return pointsPositions.value.reduce((acc, e, i, a) => i === 0
    ? `M ${a[a.length - 1][0]},${props.svg.h} L ${e[0]},${props.svg.h} L ${e[0]},${e[1]}`
    : `${acc} ${bezierCommand(e, i, a)}`
    , "");
});

const pointsPositions = computed(() => {
  return props.d.values.map(e => {
    const x = lib.map(
      e[0],
      props.o.xMin,
      props.o.xMax + 8,
      0,
      props.svg.w
    );
    const y = lib.map(
      e[1],
      props.o.yMin - 2,
      props.o.yMax + 4,
      props.svg.h,
      0
    );
    return [x, y];
  });
});

function line(pointA, pointB) {
  const lengthX = pointB[0] - pointA[0];
  const lengthY = pointB[1] - pointA[1];
  return {
    length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
    angle: Math.atan2(lengthY, lengthX)
  };
};

function controlPoint(current, previous, next, reverse) {
  const p = previous || current;
  const n = next || current;
  const o = line(p, n);
  // work in progress…
  const flat = lib.map(Math.cos(o.angle) * props.o.line.flattening, 0, 1, 1, 0)
  const angle = o.angle * flat + (reverse ? Math.PI : 0);
  const length = o.length * props.o.line.smoothing;
  const x = current[0] + Math.cos(angle) * length;
  const y = current[1] + Math.sin(angle) * length;
  return [x, y];
};

function bezierCommand(point, i, a) {
  const cps = controlPoint(a[i - 1], a[i - 2], point);
  const cpe = controlPoint(point, a[i - 1], a[i + 1], true);
  const close = i === a.length - 1 ? " z" : "";
  return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}${close}`;
};
</script>

<template>
  <g>
    <path :style="styles.path" :d="pathD"></path>
    <circle :cx="p[0]" :cy="p[1]" r="2" :style="styles.circles" v-for="p in pointsPositions" />
  </g>
</template>

<style>
.chart:has(g.selected) g:not(.selected) {
  opacity: 0.2;
}

.chart g {
  transition: 0.2s opacity ease-out;
}

.chart path {
  stroke-width: 2;
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
  animation: draw 2s linear forwards;
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
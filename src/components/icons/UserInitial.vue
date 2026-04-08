<script setup>
import { computed } from "vue";
import { cssColor, isEmailLike } from "@/helpers";

const props = defineProps(["user", "score", "leader", "colorKey", "initialLabel"]);

const initial = computed(() => {
  const rawUser = String(props.user ?? "").trim();
  const label = String(props.initialLabel || props.user || "").trim();
  const source = isEmailLike(rawUser) ? rawUser : label;
  return source ? source.substring(0, 1) : "";
});

const colorSource = computed(() => props.colorKey || props.user);
</script>

<template>
  <span class="user" :style="{ color: cssColor(colorSource), backgroundColor: cssColor(colorSource), }"><span class="initial">{{ initial }}</span>
    <span v-if="props.score" class="score" :class="props.leader && 'leader'">{{ props.score }}</span>
  </span>
  <slot></slot>
</template>

<style>
.user {
  position: relative;
  display: inline-flex;
  width: 2em;
  height: 2em;
  border-radius: 50%;
  font-size: 0.8rem;
  text-transform: uppercase;
  align-self: center;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
  filter: sepia(0.6);
}

.user + span {
  position: relative;
  margin: 0 1ch 0 0.5ch;
  font-size: 0.9em;
}

.user + .user {
  margin: 0 0 0 -0.5em;
}

.initial {
  font-size: 1rem;
  filter: invert(1) hue-rotate(45deg);
}

.score {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 50%;
  color: var(--color-background);
  background: var(--color-text);
  box-shadow: 0 1px 1px 0 var(--color-text);
}

.score.leader {
  color: black;
  background: gold;
}

.user-button .me::before {
  content: "Jag:";
  display: inline-block;
  position: absolute;
  font-style: italic;
  opacity: 0.8;
}

.score.leader::before,
.score.leader::after {
  content: "";
  display: block;
  position: absolute;
  width: 7px;
  height: 20px;
  background: inherit;
  top: 5px;
  transform: rotate(10deg) skewX(30deg);
  z-index: -1;
  box-shadow: 0 1px 0 0 var(--color-text);
}

.score.leader::after {
  transform: rotate(350deg) skewX(330deg);
}
</style>

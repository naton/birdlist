<script setup>
import { computed } from "vue";
const props = defineProps(["user", "score", "leader"]);

const initial = computed(() => {
  return props.user ? props.user.substring(0, 1) : "";
});

// TODO: Put in helper file
function cssColor(string) {
  if (!string) return "";
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 3) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  };

  return "#" + hashCode(string).substring(2, 8);
}
</script>

<template>
  <span
    class="user"
    :style="{
      color: cssColor(user),
      backgroundColor: cssColor(user),
    }"
    ><span class="initial">{{ initial }}</span>
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
  box-shadow: 0 1px 1px 0 var(--co-grey-dark);
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
  box-shadow: 0 1px 0 0 var(--co-grey-dark);
}
.score.leader::after {
  transform: rotate(350deg) skewX(330deg);
}
</style>

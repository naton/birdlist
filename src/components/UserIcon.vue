<script setup>
import { computed } from "vue";
const props = defineProps(["user", "score", "leader"]);

const initial = computed(() => {
  return props.user ? props.user.substring(0, 1) : "";
});

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
    <span v-if="props.score" class="score" :class="props.leader && 'leader'">{{
      props.score
    }}</span>
  </span>
  <slot></slot>
</template>

<style>
.user {
  position: relative;
  display: inline-flex;
  box-sizing: content-box;
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
  top: -3px;
  right: -3px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  color: var(--color-background);
  background: var(--color-text);
  box-shadow: 0 1px 2px var(--co-grey-darkest);
}

.score.leader {
  color: black;
  background: gold;
}
</style>

<script setup>
import { computed } from "vue";
const props = defineProps(["user"]);

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
    ><span class="initial">{{ initial }}</span></span
  >
  <slot></slot>
</template>

<style>
.user {
  display: inline-flex;
  width: 2em;
  height: 2em;
  border-radius: 50%;
  font-size: 0.8rem;
  text-transform: uppercase;
  align-self: center;
  align-items: center;
  justify-content: center;
  line-height: 1.3;
}

.user + span {
  margin: 0 1ch 0 0.5ch;
}

.user + .user {
  margin: 0 0 0 -0.5em;
}

.initial {
  filter: invert(1);
}
</style>

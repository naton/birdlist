<script setup>
const emit = defineEmits(["check", "remove"]);
const props = defineProps(["bird", "edit", "checked"]);
</script>

<template>
  <li class="bird">
    <button :disabled="props.edit" @click="emit('check', props.bird)" class="check-button">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <polyline v-if="props.checked" fill="none" stroke="var(--color-text)" stroke-width="2" points=" 9,17 13,21 23,11 "></polyline>
        <circle fill="none" stroke="var(--color-text)" stroke-width="2" cx="16" cy="16" r="15"></circle>
      </svg>
    </button>
    <span class="name">{{ props.bird }}</span>
    <button v-if="props.edit" @click="emit('remove', props.bird)">✕</button>
  </li>
</template>

<style>
li.bird {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem 0.5rem 0.5rem;
}

li.bird .name {
  padding-left: 0;
  background: none;
}

.check-button {
  padding: 0;
  background: none;
}
</style>
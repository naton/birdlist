<script setup>
const emit = defineEmits(["check", "remove"]);
const props = defineProps(["bird", "edit", "checked"]);
</script>

<template>
  <li class="bingo" :class="props.checked && 'checked'">
    <button :disabled="props.edit" @click="emit('check', props.bird)" class="bingo-button">
      <span class="name">{{ props.bird }}</span>
    </button>
    <button v-if="props.edit" @click="emit('remove', props.bird)">✕</button>
  </li>
</template>

<style>
li.bingo {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  align-items: center;
  justify-content: center;
}

li.bingo.checked {
  background: var(--color-background-dim);
  box-shadow: inset 0 0 0 1px var(--color-border);
}

li.bingo .name {
  margin: auto;
  padding-left: 0;
  background: none;
}

.bingo-button {
  width: 100%;
  height: 100%;
  padding: 0;
  color: inherit;
  background: none;
}

.bingo-button + button {
  position: relative;
  top: -30%;
}
</style>
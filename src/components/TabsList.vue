<script setup>
import { ref } from "vue";

defineProps(["tabList"]);
const activeTab = ref(1);
</script>

<template>
  <ul class="c-tabs">
    <li
      v-for="(tab, index) in tabList"
      :key="index"
      class="c-tabs__tab"
      :class="{ 'c-tabs__tab--active': index + 1 === activeTab }"
    >
      <input
        type="radio"
        name="tabs"
        :id="`tab-${index}`"
        :value="index + 1"
        v-model="activeTab"
        hidden
      />
      <label :for="`tab-${index}`" v-text="tab" />
    </li>
  </ul>
  <template v-for="(tab, index) in tabList">
    <div :key="index" v-if="index + 1 === activeTab">
      <slot :name="`tabPanel-${index + 1}`" />
    </div>
  </template>
</template>

<style>
.c-tabs {
  display: flex;
  list-style: none;
  overflow: auto;
  white-space: nowrap;
  padding: 0;
  overscroll-behavior: none;
  background: var(--color-background-dim);
}

.c-tabs__tab label {
  display: block;
  padding: 1rem;
}

.c-tabs__tab--active {
  border-top: 2px solid;
  background: var(--color-background);
}
</style>

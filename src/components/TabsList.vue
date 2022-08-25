<script setup>
import { ref } from "vue";
import CreateList from "@/components/CreateList.vue";

defineProps(["tabList"]);
const activeTab = ref(1);
</script>

<template>
  <nav class="body-nav">
    <ul class="c-tabs">
      <li
        v-for="{ id, title } in tabList"
        :key="id"
        class="c-tabs__tab"
        :class="{ 'c-tabs__tab--active': id === activeTab }"
      >
        <input
          type="radio"
          name="tabs"
          :id="`tab-${id}`"
          :value="id"
          v-model="activeTab"
          hidden
        />
        <label :for="`tab-${id}`" v-text="title" />
      </li>
    </ul>
    <create-list />
  </nav>
  <template v-for="{ id } in tabList">
    <div class="body-content" :key="id" v-if="id === activeTab">
      <slot :name="`tabPanel-${id}`" />
    </div>
  </template>
</template>

<style>
.body-nav {
  grid-area: body-nav;
  display: flex;
  max-width: 100vw;
  overflow: hidden;
  background: var(--color-background-dim);
}

.body-content {
  grid-area: body-content;
}

.c-tabs {
  display: flex;
  list-style: none;
  overflow: auto;
  white-space: nowrap;
  padding: 0;
  overscroll-behavior: none;
  flex: 3;
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

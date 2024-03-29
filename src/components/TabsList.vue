<script setup>
import { storeToRefs } from "pinia";
import { useListsStore } from "@/stores/lists.js";

const emit = defineEmits(["activate"]);

const listsStore = useListsStore();
const { myLists, currentList } = storeToRefs(listsStore);

const props = defineProps(["monthLabel", "yearLabel", "user"]);

function emitActiveTab(list) {
  emit("activate", list);
}
</script>

<template>
  <nav class="body-nav">
    <ul class="c-tabs">
      <li class="c-tabs__tab" :class="{ 'c-tabs__tab--active': 'monthly' === currentList.id }">
        <input type="radio" name="list" id="tab-monthly" :value="currentList.id" :checked="'monthly' === currentList.id" @change="emitActiveTab('monthly')" hidden />
        <label for="tab-monthly">{{ props.monthLabel }}</label>
      </li>
      <li class="c-tabs__tab" :class="{ 'c-tabs__tab--active': 'everything' === currentList.id, }">
        <input type="radio" name="list" id="tab-everything" :value="currentList.id" :checked="'everything' === currentList.id" @change="emitActiveTab('everything')" hidden />
        <label for="tab-everything">{{ props.yearLabel }}</label>
      </li>
    </ul>
  </nav>

  <template v-if="'monthly' === currentList.id">
    <slot name="tabPanel-monthly" />
  </template>

  <template v-else-if="'everything' === currentList.id">
    <slot name="tabPanel-everything" />
  </template>

  <template v-else>
    <slot :name="`tabPanel-${list.id}`" v-for="list in myLists" :key="list.id" />
  </template>
</template>

<style>
.c-tabs {
  display: flex;
  width: 100%;
  list-style: none;
  overflow-y: hidden;
  overflow-x: auto;
  white-space: nowrap;
  padding: 0;
  overscroll-behavior: none;
}

.c-tabs__tab {
  min-width: 3.6rem;
}

.c-tabs__tab.last {
  align-self: center;
  margin-left: auto;
}

.c-tabs__tab label {
  position: relative;
  display: block;
  height: 100%;
  padding: 1rem 0.4rem 0.8rem 0.8rem;
  font-size: 1.2rem;
  text-transform: capitalize;
}

.c-tabs__tab--active label {
  margin-top: 2px;
  padding: 0.7rem 1rem 0.9rem;
  border-top: 2px solid;
  border-top-left-radius: var(--radius);
  border-top-right-radius: var(--radius);
  background: var(--color-background);
}
</style>

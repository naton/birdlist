<script setup>
import { computed } from "vue";
import CreateList from "@/components/CreateList.vue";
import { getCurrentMonthName, getCurrentYear } from "../helpers";

const props = defineProps(["currentList", "tabList"]);
const emit = defineEmits(["activate", "edit"]);
const currentList = computed({
  get() {
    return props.currentList;
  },
  set(list) {
    emit("activate", list);
  },
});

function emitActiveTab(list) {
  emit("activate", list);
}
</script>

<template>
  <nav class="body-nav">
    <ul class="c-tabs">
      <li
        class="c-tabs__tab"
        :class="{ 'c-tabs__tab--active': 'monthly' === props.currentList.id }"
      >
        <input
          type="radio"
          name="list"
          id="tab-monthly"
          :value="props.currentList.id"
          :checked="'monthly' === props.currentList.id"
          @change="emitActiveTab('monthly')"
          hidden
        />
        <label for="tab-monthly">{{ getCurrentMonthName() }}</label>
      </li>
      <li
        class="c-tabs__tab"
        :class="{
          'c-tabs__tab--active': 'everything' === props.currentList.id,
        }"
      >
        <input
          type="radio"
          name="list"
          id="tab-everything"
          :value="props.currentList.id"
          :checked="'everything' === props.currentList.id"
          @change="emitActiveTab('everything')"
          hidden
        />
        <label for="tab-everything">{{ getCurrentYear() }}</label>
      </li>
      <li class="c-tabs__tab">
        <select name="name" v-model="currentList" class="transparent">
          <option v-for="list in tabList" :key="list.id" :value="list">
            {{ list.title }}
          </option>
        </select>
        <img src="../assets/check-list-icon.svg" width="32" height="32" alt="Välj lista" />
      </li>
      <create-list @activate="emitActiveTab" />
    </ul>
  </nav>

  <template v-if="'monthly' === props.currentList.id">
    <slot name="tabPanel-monthly" />
  </template>

  <template v-else-if="'everything' === props.currentList.id">
    <slot name="tabPanel-everything" />
  </template>

  <template v-else v-for="list in tabList" :key="list.id">
    <slot :name="`tabPanel-${list.id}`" />
  </template>
</template>

<style>
.c-tabs {
  display: flex;
  align-items: center;
  list-style: none;
  overflow: auto;
  white-space: nowrap;
  padding: 0;
  overscroll-behavior: none;
}

.c-tabs__tab label {
  display: block;
  padding: 1rem;
  text-transform: capitalize;
}

.c-tabs__tab--active {
  border-top: 2px solid;
  background: var(--color-background);
}

.transparent {
  position: absolute;
  left: 1rem;
  width: 32px;
  height: 32px;
  opacity: 0;
}

.transparent + img {
  display: block;
  margin: 0 0 0 1rem;
  pointer-events: none;
}
</style>

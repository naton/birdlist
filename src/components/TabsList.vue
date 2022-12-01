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
      <li
        class="c-tabs__tab"
        :class="{
          'c-tabs__tab--active':
            'everything' !== props.currentList.id &&
            'monthly' !== props.currentList.id,
        }"
      >
        <select name="name" v-model="currentList" class="transparent-menu">
          <option value="monthly">Välj lista…</option>
          <option v-for="list in tabList" :key="list.id" :value="list">
            {{ list.title }}
          </option>
        </select>
        <img
          src="../assets/check-list-icon.svg"
          width="32"
          height="32"
          alt="Välj lista"
        />
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
  width: 100%;
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
  border-top-left-radius: var(--radius);
  border-top-right-radius: var(--radius);
  background: var(--color-background);
}

.transparent-menu {
  position: absolute;
  left: 0;
  right: 0;
  height: 3.5rem;
  padding: 1.5rem 2rem;
  opacity: 0;
  font-size: 1.5rem;
}

.transparent-menu + img {
  display: block;
  width: 1.3rem;
  height: 3.5rem;
  margin: 0 1.2rem;
  pointer-events: none;
}

@media (prefers-color-scheme: dark) {
  .transparent-menu + img {
    filter: invert(1);
  }
}
</style>

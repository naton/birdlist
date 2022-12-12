<script setup>
import { computed } from "vue";
import CreateList from "@/components/CreateList.vue";

const props = defineProps(["monthLabel", "yearLabel", "currentList", "tabList"]);
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
      <li class="c-tabs__tab" :class="{ 'c-tabs__tab--active': 'monthly' === props.currentList.id }">
        <input
          type="radio"
          name="list"
          id="tab-monthly"
          :value="props.currentList.id"
          :checked="'monthly' === props.currentList.id"
          @change="emitActiveTab('monthly')"
          hidden
        />
        <label for="tab-monthly">{{ props.monthLabel }}</label>
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
        <label for="tab-everything">{{ props.yearLabel }}</label>
      </li>
      <li
        class="c-tabs__tab"
        :class="{
          'c-tabs__tab--active': 'everything' !== props.currentList.id && 'monthly' !== props.currentList.id,
        }"
      >
        <label>
          <select name="name" v-model="currentList" class="transparent-menu">
            <option value="monthly">Välj lista…</option>
            <option v-for="list in tabList" :key="list.id" :value="list">
              {{ list.title }}
            </option>
          </select>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12">
            <path
              fill="currentColor"
              d="M11 9H1a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2Zm0-8H1a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2Zm0 4H1a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2Z"
            />
          </svg>
        </label>
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
  list-style: none;
  overflow-y: hidden;
  overflow-x: auto;
  white-space: nowrap;
  padding: 0;
  overscroll-behavior: none;
}

.c-tabs__tab.last {
  align-self: center;
  margin-left: auto;
}

.c-tabs__tab.last .add {
  margin-right: 1rem;
  margin-left: 1rem;
  padding-right: 1rem;
  padding-left: 1rem;
}

.c-tabs__tab label {
  position: relative;
  display: block;
  padding: 1rem 1rem 0.8rem;
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

.c-tabs__tab svg {
  display: block;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0.1rem;
  pointer-events: none;
}

.transparent-menu {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  font-size: 1.5rem;
}
</style>

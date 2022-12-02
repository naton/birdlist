<script setup>
import { computed } from "vue";
import CreateList from "@/components/CreateList.vue";
import { getCurrentYear } from "../helpers";

const props = defineProps(["label", "currentList", "tabList"]);
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
        <label for="tab-monthly">{{ props.label }}</label>
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 12 12"
          width="32"
          height="32"
        >
          <path
            d="M11 9H1a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2Zm0-8H1a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2Z"
          />
          <path d="M11 5H1a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2Z" />
        </svg>
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

.c-tabs__tab--active label {
  padding-top: 0.8rem;
}

.transparent-menu {
  position: absolute;
  left: 0;
  right: 0;
  height: 3.4rem;
  padding: 1.5rem;
  opacity: 0;
  font-size: 1.5rem;
}

.transparent-menu + svg {
  display: block;
  width: 1.3rem;
  height: 3.4rem;
  margin: 0 1.2rem;
  pointer-events: none;
}
</style>

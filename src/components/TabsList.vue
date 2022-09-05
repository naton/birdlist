<script setup>
import CreateList from "@/components/CreateList.vue";

const props = defineProps(["currentList", "tabList"]);

const emit = defineEmits(["activate", "edit"]);

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
          name="tabs"
          id="tab-monthly"
          :value="props.currentList.id"
          :checked="'monthly' === props.currentList.id"
          @change="emitActiveTab('monthly')"
          hidden
        />
        <label for="tab-monthly">Månadskryss</label>
      </li>
      <li
        class="c-tabs__tab"
        :class="{
          'c-tabs__tab--active': 'everything' === props.currentList.id,
        }"
      >
        <input
          type="radio"
          name="tabs"
          id="tab-everything"
          :value="props.currentList.id"
          :checked="'everything' === props.currentList.id"
          @change="emitActiveTab('everything')"
          hidden
        />
        <label for="tab-everything">Årskryss</label>
      </li>
      <li
        v-for="list in tabList"
        :key="list.id"
        class="c-tabs__tab"
        :class="{ 'c-tabs__tab--active': list.id === props.currentList.id }"
      >
        <input
          type="radio"
          name="tabs"
          :id="`tab-${list.id}`"
          :value="list.id"
          :checked="list.id === props.currentList.id"
          @change="emitActiveTab(list)"
          hidden
        />
        <label :for="`tab-${list.id}`" v-text="list.title" />
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
}

.c-tabs__tab--active {
  border-top: 2px solid;
  background: var(--color-background);
}
</style>

<script setup>
import CreateList from "@/components/CreateList.vue";
const props = defineProps(["tab", "tabList"]);

const emit = defineEmits(["activate"]);

function emitActiveTab(id) {
  emit("activate", id);
}
</script>

<template>
  <nav class="body-nav">
    <ul class="c-tabs">
      <li
        class="c-tabs__tab"
        :class="{ 'c-tabs__tab--active': 'monthly' === props.tab }"
      >
        <input
          type="radio"
          name="tabs"
          id="tab-monthly"
          value="monthly"
          @change="emitActiveTab('monthly')"
          hidden
        />
        <label for="tab-monthly">Månadskryss</label>
      </li>
      <li
        class="c-tabs__tab"
        :class="{ 'c-tabs__tab--active': 'everything' === props.tab }"
      >
        <input
          type="radio"
          name="tabs"
          id="tab-everything"
          value="everything"
          @change="emitActiveTab('everything')"
          hidden
        />
        <label for="tab-everything">Alla kryss</label>
      </li>
      <li
        v-for="{ id, title } in tabList"
        :key="id"
        class="c-tabs__tab"
        :class="{ 'c-tabs__tab--active': id === props.tab }"
      >
        <input
          type="radio"
          name="tabs"
          :id="`tab-${id}`"
          :value="id"
          :checked="id === props.tab"
          @change="emitActiveTab(id)"
          hidden
        />
        <label :for="`tab-${id}`" v-text="title" />
      </li>
      <create-list @activate="emitActiveTab" />
    </ul>
  </nav>

  <template v-if="'monthly' === props.tab">
    <slot name="tabPanel-monthly" />
  </template>

  <template v-else-if="'everything' === props.tab">
    <slot name="tabPanel-everything" />
  </template>

  <template v-else v-for="{ id } in tabList" :key="id">
    <slot :name="`tabPanel-${id}`" />
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

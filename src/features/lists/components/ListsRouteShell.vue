<script setup>
import { defineAsyncComponent } from "vue";
import ListsRouteLoading from "./ListsRouteLoading.vue";

const AsyncListsView = defineAsyncComponent({
  loader: () => import("@/views/ListsView.vue"),
  loadingComponent: ListsRouteLoading,
  delay: 0,
  suspensible: false,
});
</script>

<template>
  <async-lists-view />
</template>

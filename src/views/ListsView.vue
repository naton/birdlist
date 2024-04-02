<script setup>
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView } from 'vue-router';
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from "@/stores/lists.js";
import NavTabs from "@/components/NavTabs.vue";
import CreateList from "@/components/CreateList.vue";

const settingsStore = useSettingsStore()
const { t } = settingsStore

const listsStore = useListsStore();
const { myLists, currentList } = storeToRefs(listsStore);
</script>

<template>
    <nav-tabs></nav-tabs>

    <div class="body-content">
      <router-view v-slot="{ Component, route }">
        <component :is="Component" :key="`${route.path}`"></component>
        <div v-if="!Component" class="lists">
            <div class="lists-content">
                <create-list :list="currentList" />
                <h1>{{ t("Lists") }}</h1>
                <ul class="list">
                    <li v-for="list in myLists" :key="list.id">
                        <router-link :to="{ name: 'list', params: { id: list.id } }">{{ list.title }}</router-link>
                    </li>
                </ul>
            </div>
        </div>
      </router-view>
    </div>
</template>

<style>
.lists-content {
  display: grid;
  align-content: start;
  gap: 1rem;
  padding: 1rem;
  overflow: auto;
  height: calc(100dvh - 8.5rem);
}
</style>
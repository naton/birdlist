<script setup>
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router';
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from "@/stores/lists.js";
import CreateList from "@/components/CreateList.vue";

const emit = defineEmits(["activate"]);

const settingsStore = useSettingsStore()
const { t } = settingsStore

const listsStore = useListsStore();
const { myLists, currentList } = storeToRefs(listsStore);

function emitActiveTab(list) {
  emit("activate", list);
}
</script>

<template>
    <div class="lists">
        <div class="lists-content">
            <h1>{{ t("Lists") }}</h1>
            <ul class="list">
                <li v-for="list in myLists" :key="list.id">
                    <router-link :to="{ name: 'list', params: { id: list.id } }">{{ list.title }}</router-link>
                </li>
            </ul>
        </div>
    </div>
    <create-list @activate="emitActiveTab" :list="currentList" />
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
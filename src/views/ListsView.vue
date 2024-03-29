<script setup>
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router';
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from "@/stores/lists.js";

const settingsStore = useSettingsStore()
const { t } = settingsStore

const listsStore = useListsStore();
const { myLists } = storeToRefs(listsStore);
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
</template>

<style>
.lists-content {
  display: grid;
  align-self: start;
  gap: 1rem;
  padding: 1rem;
}
</style>
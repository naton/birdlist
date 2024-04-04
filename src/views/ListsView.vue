<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView } from 'vue-router';
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from "@/stores/lists.js";
import NavTabs from "@/components/NavTabs.vue";
import CreateList from "@/components/CreateList.vue";

const emit = defineEmits(["edit"]);
const settingsStore = useSettingsStore()
const { t } = settingsStore

const listsStore = useListsStore();
const { createList } = listsStore;
const { myLists, currentList } = storeToRefs(listsStore);

const listDialog = ref(null);
const selectedList = defineModel();

function newList() {
  listDialog.value.openModal();
}

function selectList(list) {
  currentList.value = list;
  selectedList.value = selectedList.value == list;
}

function emitEdit(obs) {
  emit("edit", obs);
}
</script>

<template>
  <nav-tabs></nav-tabs>

  <div class="body-content">
    <create-list ref="listDialog" />

    <router-view v-slot="{ Component, route }" @edit="emitEdit">
      <component :is="Component" :key="`${route.path}`"></component>
      <template v-if="!Component">
        <div class="list-tools">
          <button class="add" @click="newList">
            {{ t("Create_New_List") }}
          </button>
        </div>

        <div class="lists">
          <div class="lists-content">
            <h1>{{ t("Lists") }}</h1>
            <ul class="list">
              <li v-for="list in myLists" :key="list.id" :selectedList="selectedList == list" @click="selectList(list)">
                <router-link :to="{ name: 'list', params: { id: list.id } }">{{ list.title }}</router-link>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </router-view>
  </div>
</template>

<style>
.list-tools {
  margin: 1rem;
}

.lists-content {
  display: grid;
  align-content: start;
  gap: 1rem;
  padding: 1rem;
  overflow: auto;
  height: calc(100dvh - 8.5rem);
}
</style>
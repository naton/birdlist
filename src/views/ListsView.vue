<script setup>
import { db } from "../db";
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView } from 'vue-router';
import { useObservable } from "@vueuse/rxjs";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from "@/stores/lists.js";
import ListsIcon from "@/components/icons/ListsIcon.vue";
import NavTabs from "@/components/NavTabs.vue";
import CreateList from "@/components/CreateList.vue";

const emit = defineEmits(["edit"]);
const settingsStore = useSettingsStore()
const { t } = settingsStore

const listsStore = useListsStore();
const { allLists, currentList, lastUsedList } = storeToRefs(listsStore);

const createListDialog = ref(null);

const listInvites = useObservable(db.cloud.invites);

function newList() {
  createListDialog.value.openModal();
}

function selectList(list) {
  currentList.value = list;
  lastUsedList.value = list;
}

function deleteInvite(invite) {
  db.members.delete(invite.id)
}

function emitEdit(obs) {
  emit("edit", obs);
}
</script>

<template>
  <nav-tabs></nav-tabs>
  <create-list ref="createListDialog" />
  <div class="body-content">
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
            <router-link :to="{ name: 'list', params: { id: lastUsedList.id }}" v-if="lastUsedList" class="featured">
              <i>Senast besökta lista:</i><br>
              <h2>{{ lastUsedList.title }}</h2>
              <p>{{ lastUsedList.description }}</p>
            </router-link>
            <ul class="list">
              <li v-for="list in allLists" :key="list.id" @click="selectList(list)">
                <lists-icon />
                <router-link :to="{ name: 'list', params: { id: list.id } }">{{ list.title }}</router-link>
              </li>
            </ul>
            <h2 v-if="listInvites.length">{{ t("Invites") }}</h2>
            <ul class="list">
              <li v-for="list in listInvites.filter(invite => invite.rejected)" :key="list.id">
                <lists-icon />
                <b>{{ list.realm.name }}</b>
                <button @click="list.accept()">{{ t("Accept") }}</button>
                <button class="secondary" @click="deleteInvite(list)">{{ t("Delete") }}</button>
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

.featured {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: inherit;
  text-decoration: none;
}

.featured h2 {
  text-decoration: underline;
  text-underline-offset: 0.1em;
}
</style>
<script setup>
import { db } from "../db";
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView } from 'vue-router';
import { useObservable } from "@vueuse/rxjs";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from "@/stores/lists.js";
import UserInitial from "@/components/icons/UserInitial.vue";
import ListsIcon from "@/components/icons/ListsIcon.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import BingoIcon from "@/components/icons/BingoIcon.vue";
import StreakIcon from "@/components/icons/StreakIcon.vue";
import NormalIcon from "@/components/icons/NormalIcon.vue";
import CreateList from "@/components/CreateList.vue";
import ListsIllustration from '../components/illustrations/ListsIllustration.vue';

const emit = defineEmits(["edit"]);
const settingsStore = useSettingsStore()
const { t } = settingsStore
const { isPremiumUser } = storeToRefs(settingsStore)

const listsStore = useListsStore();
const { getListMembers } = listsStore;
const { allLists, allMyLists, currentList, lastUsedList } = storeToRefs(listsStore);

const showOnlyMine = ref(false);
const createListDialog = ref(null);

const listInvites = useObservable(db.cloud.invites);

function newList() {
  createListDialog.value.showModal();
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

const listMembersLoaded = ref(false);

onMounted(async () => {
  setTimeout(() => {
    allLists.value.forEach(async list => {
      list.members = await getListMembers(list.id);
    })
    listMembersLoaded.value = true;
  }, 500)
});
</script>

<template>
  <create-list ref="createListDialog" />
  <div class="body-content">
    <router-view v-slot="{ Component, route }" @edit="emitEdit">
      <component :is="Component" :key="`${route.path}`"></component>
      <template v-if="!Component">
        <section class="lists">
          <figure class="center">
            <lists-illustration />
          </figure>
          <div class="list-tools">
            <h1 class="center">{{ t("Lists") }}</h1>
            <div class="flex">
              <button v-if="allMyLists?.length > 0" class="add" @click="newList" :disabled="!isPremiumUser && allMyLists?.length >= 5">
                {{ t("Create_New_List") }}
                <span class="pill">{{ allMyLists?.length }} / {{ isPremiumUser ? "∞" : "5" }}</span>
              </button>
            </div>
          </div>
          <div v-if="!isPremiumUser && allMyLists?.length >= 5" class="center margin-bottom">
            {{ t("Upgrade_To_Premium") }}
          </div>
          <div class="lists-content">
            <router-link v-if="lastUsedList" :to="{ name: 'list', params: { id: lastUsedList.id } }" class="featured">
              <i>{{ t("Last_Viewed_List") }}:</i><br>
              <h2 class="flex">
                {{ lastUsedList.title }}
              </h2>
              <p>{{ lastUsedList.description }}</p>
              <p class="margin-top"><template v-for="member in lastUsedList.members" :key="member">
                <user-initial :user="member.email" />
              </template></p>
            </router-link>

            <div>
              <label>
                <input v-model="showOnlyMine" type="checkbox" switch>
                {{ t("Show_Only_Mine") }}
              </label>
            </div>
            <ul v-if="allLists?.length" class="list">
              <li v-for="list in (showOnlyMine ? allMyLists : allLists)" :key="list.id" class="list-item">
                <lists-icon />
                <router-link :to="{ name: 'list', params: { id: list.id } }" @click="selectList(list)" class="list-name">{{ list.title }}</router-link>
                <div>
                  <check-icon v-if="list.type === 'checklist'" />
                  <bingo-icon v-else-if="list.type === 'bingo'" />
                  <streak-icon v-else-if="list.type === 'birdstreak'" />
                  <normal-icon v-else />
                </div>
                <div class="list-members">
                  <transition name="fade-in">
                    <div v-if="listMembersLoaded">
                      <template v-for="member in list.members" :key="member">
                        <user-initial :user="member.email" />
                      </template>
                    </div>
                  </transition>
                </div>
              </li>
            </ul>
            <div v-else class="empty-list">
              <p>{{ t("No_Lists") }}</p>
              <button class="add" @click="newList">
                {{ t("Create_New_List") }}
              </button>
            </div>
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
        </section>
      </template>
    </router-view>
  </div>
</template>

<style>
.list-tools {
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  padding: 1rem 1rem 0.5rem;
  background-color: var(--color-background);
  z-index: 1;
}

.list .list-item {
  display: grid;
  grid-template-columns: 20px 1fr 24px;
  grid-template-rows: auto auto;
}

.list-name {
  font-size: 1.2rem;
}

.list-members {
  min-height: 2.5rem;
  grid-row: 2;
  grid-column: 2 / 4;
  padding: 0 1em 0.6rem;
}

button .pill {
  position: absolute;
  right: -0.5em;
  margin-top: 1.75em;
  font-size: 0.75em;
}

button:has(.pill) {
  position: relative;
}

.lists-content {
  display: grid;
  align-content: start;
  gap: 1.5rem;
  padding: 0.5rem 1rem 1rem;
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
  text-underline-offset: 0.2em;
}

.buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
}
</style>
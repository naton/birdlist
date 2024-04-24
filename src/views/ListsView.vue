<script setup>
import { db } from "../db";
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView } from 'vue-router';
import { useObservable } from "@vueuse/rxjs";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from "@/stores/lists.js";
import { askNotificationPermission, removePushManager } from "../helpers";
import UserInitial from "@/components/icons/UserInitial.vue";
import ListsIcon from "@/components/icons/ListsIcon.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import BingoIcon from "@/components/icons/BingoIcon.vue";
import StreakIcon from "@/components/icons/StreakIcon.vue";
import NormalIcon from "@/components/icons/NormalIcon.vue";
import NavTabs from "@/components/NavTabs.vue";
import CreateList from "@/components/CreateList.vue";
import ListsIllustration from '../components/illustrations/ListsIllustration.vue';

const emit = defineEmits(["edit"]);
const settingsStore = useSettingsStore()
const { t } = settingsStore
const { isPremiumUser } = storeToRefs(settingsStore)

const listsStore = useListsStore();
const { getListMembers } = listsStore;
const { allLists, allMyLists, currentList, lastUsedList, isSubscribedToNotifications } = storeToRefs(listsStore);

const showOnlyMine = ref(false);
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

/* subscribe to push notifications */
function toggleSubscription() {
  if (!isSubscribedToNotifications.value) {
    console.log("Subscribing...");
    askNotificationPermission(toggleNotificationIcon);
  } else {
    console.log("Unsubscribing...");
    removePushManager(toggleNotificationIcon);
  }
}

function toggleNotificationIcon() {
  isSubscribedToNotifications.value = !isSubscribedToNotifications.value;
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
  <nav-tabs></nav-tabs>
  <create-list ref="createListDialog" />
  <div class="body-content">
    <router-view v-slot="{ Component, route }" @edit="emitEdit">
      <component :is="Component" :key="`${route.path}`"></component>
      <template v-if="!Component">
        <div class="center">
          <lists-illustration />
        </div>
        <div class="lists">
          <div class="list-tools">
            <h1 class="center">{{ t("Lists") }}</h1>
            <div class="flex">
              <div v-if="isPremiumUser" class="notify-button">
                <button type="button" @click="toggleSubscription">
                  <svg v-if="!isSubscribedToNotifications" xmlns="http://www.w3.org/2000/svg" stroke-width="2" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="none" stroke="currentColor" stroke-linecap="square" stroke-miterlimit="10" d="M19 11V8A7 7 0 0 0 5 8v3c0 3.3-3 4.1-3 6 0 1.7 3.9 3 10 3s10-1.3 10-3c0-1.9-3-2.7-3-6Z" />
                    <path fill="currentColor" d="M12 22a38.81 38.81 0 0 1-2.855-.1 2.992 2.992 0 0 0 5.71 0c-.894.066-1.844.1-2.855.1Z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M20 10V8A8 8 0 0 0 4 8v2a4.441 4.441 0 0 1-1.547 3.193A4.183 4.183 0 0 0 1 16c0 2.5 4.112 4 11 4s11-1.5 11-4a4.183 4.183 0 0 0-1.453-2.807A4.441 4.441 0 0 1 20 10Z" />
                    <path fill="currentColor" d="M9.145 21.9a2.992 2.992 0 0 0 5.71 0c-.894.066-1.844.1-2.855.1s-1.961-.032-2.855-.1Z" />
                  </svg>
                </button>
              </div>
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
              <h2>{{ lastUsedList.title }}</h2>
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
              <li v-for="list in (showOnlyMine ? allMyLists : allLists)" :key="list.id" class="list-item" @click="selectList(list)">
                <lists-icon />
                <router-link :to="{ name: 'list', params: { id: list.id } }" class="list-name">{{ list.title }}</router-link>
                <div>
                  <check-icon v-if="list.type === 'checklist'" />
                  <bingo-icon v-else-if="list.type === 'bingo'" />
                  <streak-icon v-else-if="list.type === 'birdstreak'" />
                  <normal-icon v-else />
                </div>
                <transition name="fade-in">
                <div v-if="listMembersLoaded" class="list-members">
                  <template v-for="member in list.members" :key="member">
                    <user-initial :user="member.email" />
                  </template>
                </div>
                </transition>
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
        </div>
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

.list-tools .notify-button {
  margin-left: auto;
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
  min-height: 2.2rem;
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
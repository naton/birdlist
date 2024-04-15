<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { db } from "../db";
import { useSettingsStore } from '../stores/settings.js'
import { useFriendsStore } from '../stores/friends.js'
import { useListsStore } from '../stores/lists.js'
import FriendsIcon from '@/components/icons/FriendsIcon.vue'

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { isUserLoggedIn } = storeToRefs(settingsStore)

const friendsStore = useFriendsStore()
const { allFriends } = storeToRefs(friendsStore)

const listsStore = useListsStore()
const { getListMembers, shareBirdList } = listsStore
const { currentList } = storeToRefs(listsStore)

const shareListDialog = ref(null);
const selectedFriends = ref([]);
const listMembers = ref([]);

async function openModal() {
  listMembers.value = await getListMembers(currentList.value.id);
  shareListDialog.value.showModal();
}

function shareAndClose() {
  shareBirdList(currentList.value.id, currentList.value.title, selectedFriends.value);
  closeModal();
}

function isMember(friend) {
  if (!friend.email) {
    return
  }

  return listMembers.value.some(member => member.email === friend.email && member.accepted);
}

function closeModal() {
  shareListDialog.value.close();
}

defineExpose({
  openModal,
  closeModal,
})
</script>

<template>
  <dialog ref="shareListDialog" class="dialog">
    <div class="grid">
      <friends-icon />
      <h2>{{ t("Invite_Your_Friends") }}!</h2>
    </div>
    <article v-if="!allFriends.length" class="margin-top margin-bottom">
      <p>{{ t("Create_Some_Friends_First") }} <router-link :to="{ name: 'friends' }">{{ t("Create_A_Friend").toLowerCase() }}</router-link>.</p>
    </article>
    <details class="help margin-top margin-bottom">
      <summary>{{ t("What_Is_This") }}</summary>
      <p class="margin-left">{{ t("Invite_Help_1") }}</p>
      <p class="margin-left">{{ t("Invite_Help_2") }}</p>
    </details>
    <div v-if="!isUserLoggedIn" class="center">
      <p>{{ t("You_Need_To_Login_First") }}</p>
    </div>
    <table v-else-if="allFriends.length" class="margin-bottom">
      <tbody>
        <tr v-for="(friend, index) in allFriends" :key="friend.email">
          <td><input type="checkbox" v-model="selectedFriends" :id="`friend-${index}`" :value="{ name: friend.name, email: friend.email }" :disabled="isMember(friend) || !isUserLoggedIn" /></td>
          <td><label :for="`friend-${index}`">{{ friend.name }}</label></td>
          <td>{{ isMember(friend) ? 'redan medlem' : '' }}</td>
        </tr>
      </tbody>
    </table>
    <div class="buttons">
      <button v-if="!isUserLoggedIn" type="button" @click="closeModal(); db.cloud.login()">{{ t("Login") }}</button>
      <button v-else type="button" :disabled="!allFriends.length || !selectedFriends.length || !isUserLoggedIn" @click="shareAndClose">{{ t("Invite") }}</button>
      <button class="secondary" @click="closeModal">{{ t("Close") }}</button>
    </div>
  </dialog>
</template>

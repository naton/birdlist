<script setup>
import { ref, defineExpose } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { useSettingsStore } from '../stores/settings.js'
import { useFriendsStore } from '../stores/friends.js'
import { useListsStore } from '../stores/lists.js'

const settingsStore = useSettingsStore()
const { t } = settingsStore

const friendsStore = useFriendsStore()
const { allFriends } = storeToRefs(friendsStore)

const listsStore = useListsStore()
const { shareBirdList } = listsStore
const { currentList } = storeToRefs(listsStore)

const shareListDialog = ref(null);
const selectedFriends = ref([]);

function openModal() {
  shareListDialog.value.showModal();
}

function shareAndClose() {
  shareBirdList(currentList.value.id, currentList.value.title, selectedFriends.value);
  closeModal();
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
    <h2>{{ t("Current_Friends") }}</h2>
    <table v-if="allFriends.length" class="margin-bottom">
      <tbody>
        <tr v-for="(friend, index) in allFriends" :key="friend.email">
          <td><input type="checkbox" v-model="selectedFriends" :id="`friend-${index}`" :value="{ name: friend.name, email: friend.email }" /></td>
          <td><label :for="`friend-${index}`">{{ friend.name }}</label></td>
        </tr>
      </tbody>
    </table>
    <p v-else class="margin-bottom">
      Du behöver <router-link :to="{ name: 'friends' }">skapa en vän</router-link> först.
    </p>
    <button :disabled="!allFriends.length" @click="shareAndClose">{{ t("Invite") }}</button>
  </dialog>
</template>

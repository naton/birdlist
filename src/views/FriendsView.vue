<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '../stores/settings.js'
import { useFriendsStore } from '../stores/friends.js'

const settingsStore = useSettingsStore()
const { t } = settingsStore

const friendsStore = useFriendsStore()
const { addFriend, deleteFriend } = friendsStore
const { allFriends } = storeToRefs(friendsStore)

const newFriendName = ref()
const newFriendEmail = ref()
</script>

<template>
  <div class="friends">
    <div class="friends-content">
      <h1 class="hidden-visually">{{ t("Friends")}}</h1>
      <h2>{{ t("Add_Friend")}}</h2>
      <form @submit.prevent="addFriend(newFriendName, newFriendEmail)">
        <input type="text" required placeholder="Namn" v-model="newFriendName">
        <input type="email" required placeholder="E-postadress" v-model="newFriendEmail">
        <button type="submit"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="currentColor"><path d="M15 15c3.309 0 6-2.691 6-6V6c0-3.309-2.691-6-6-6S9 2.691 9 6v3c0 3.309 2.691 6 6 6Zm12.736 13.898c-.237.06-.481.102-.736.102-1.654 0-3-1.346-3-3v-1h-1c-1.654 0-3-1.346-3-3s1.346-3 3-3h.845a6.933 6.933 0 0 0-3.762-1.69 42.165 42.165 0 0 0-10.166 0 6.96 6.96 0 0 0-5.886 5.106l-1.997 7.321a1 1 0 0 0 .8 1.249C6.843 31.659 10.936 32 15 32s8.157-.341 12.166-1.014a1.002 1.002 0 0 0 .8-1.249l-.229-.839Z"/><path d="M31 21h-3v-3a1 1 0 1 0-2 0v3h-3a1 1 0 1 0 0 2h3v3a1 1 0 1 0 2 0v-3h3a1 1 0 1 0 0-2Z" /></g></svg></button>
      </form>
      <h2 v-if="allFriends.length">{{ t("Current_Friends")}}</h2>
      <table>
        <tbody>
          <tr v-for="{ id, name, email } in allFriends" :key="email">
            <th scope="row">{{ name }}</th>
            <td class="crop">{{ email }}</td>
            <td><button @click="deleteFriend(id)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="currentColor"><path d="M15 15c3.309 0 6-2.691 6-6V6c0-3.309-2.691-6-6-6S9 2.691 9 6v3c0 3.309 2.691 6 6 6Zm11.673 10H23c-1.654 0-3-1.346-3-3s1.346-3 3-3h.845a6.934 6.934 0 0 0-3.762-1.691 42.267 42.267 0 0 0-10.166 0 6.96 6.96 0 0 0-5.885 5.107l-1.997 7.321a1 1 0 0 0 .8 1.249C6.843 31.658 10.936 32 15 32s8.157-.341 12.165-1.014c.279-.047.525-.209.678-.447.152-.238.196-.53.122-.802L26.673 25Z"/><path d="M31 23h-8a1 1 0 1 1 0-2h8a1 1 0 1 1 0 2Z" /></g></svg></button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
.friends-content {
  display: grid;
  align-self: start;
  gap: 1rem;
  padding: 1rem;
}

.friends-content form {
  display: flex;
  gap: 0.25rem;
}

.friends-content form input {
  width: 100%;
  flex: 4 1 auto;
  padding: 0.6em;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: var(--color-background-dim);
  font: inherit;
}

.friends-content form input::placeholder {
  color: var(--color-text);
}

.friends-content th:first-child {
  padding-left: 0;
  text-align: left;
  font-weight: bold;
}

.friends-content td:last-child {
  padding-right: 0;
  text-align: right;
}

td.crop {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40vw;
}
</style>

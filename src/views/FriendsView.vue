<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '../stores/settings.js'
import { useFriendsStore } from '../stores/friends.js'
import AddFriendIcon from '../components/icons/AddFriendIcon.vue'
import RemoveFriendIcon from '../components/icons/RemoveFriendIcon.vue'

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
    <article class="friends-content">
      <section>
        <h1>{{ t("Friends")}}</h1>
        <details class="help margin-top margin-bottom">
          <summary>{{ t("What_Is_This") }}</summary>
          <p class="margin-left">{{ t("Friends_Help") }}</p>
        </details>
      </section>
      <section>
        <h2>{{ t("Add_Friend")}}</h2>
        <form @submit.prevent="addFriend(newFriendName, newFriendEmail)" class="margin-top">
          <input type="text" required placeholder="Namn" v-model="newFriendName">
          <input type="email" required placeholder="E-postadress" v-model="newFriendEmail">
          <button type="submit"><add-friend-icon /></button>
        </form>
      </section>
      <section v-if="allFriends.length">
        <h2>{{ t("Current_Friends")}}</h2>
        <table>
          <tbody>
            <tr v-for="{ id, name, email } in allFriends" :key="email">
              <th scope="row">{{ name }}</th>
              <td class="crop">{{ email }}</td>
              <td><button @click="deleteFriend(id)"><remove-friend-icon /></button></td>
            </tr>
          </tbody>
        </table>
      </section>
    </article>
  </div>
</template>

<style>
.friends-content {
  display: grid;
  align-self: start;
  gap: 1.5rem;
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

.friends-content table {
  width: 100%;
  border-collapse: collapse;
  line-height: 3;
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

.friends-content th:first-child,
td.crop {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40vw;
}
</style>

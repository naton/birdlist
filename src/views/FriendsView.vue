<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '../stores/settings.js'
import { useFriendsStore } from '../stores/friends.js'
import AddFriendIcon from '../components/icons/AddFriendIcon.vue'
import UserIcon from '../components/icons/UserIcon.vue'
import RemoveFriendIcon from '../components/icons/RemoveFriendIcon.vue'
import FriendsIllustration from '../components/illustrations/FriendsIllustration.vue';

const settingsStore = useSettingsStore()
const { t } = settingsStore

const friendsStore = useFriendsStore()
const { addFriend, deleteFriend } = friendsStore
const { allFriends } = storeToRefs(friendsStore)

const newFriendName = ref()
const newFriendEmail = ref()

function addFriendAndReset(name, email) {
  addFriend(name, email)
  newFriendName.value = ''
  newFriendEmail.value = ''
}
</script>

<template>
  <div class="friends">
    <article class="friends-content">
      <section>
        <div class="center">
          <friends-illustration />
        </div>
        <h1 class="center margin-bottom">{{ t("Friends")}}</h1>
        <details class="help margin-top margin-bottom">
          <summary>{{ t("What_Is_This") }}</summary>
          <p class="margin-left">{{ t("Friends_Help") }}</p>
        </details>
      </section>
      <section>
        <h2>
          <user-icon />
          {{ t("Add_Friend")}}…
        </h2>
        <form @submit.prevent="addFriendAndReset(newFriendName, newFriendEmail)" class="margin-top">
          <input type="text" required placeholder="Namn" v-model="newFriendName">
          <input type="email" required placeholder="E-postadress" v-model="newFriendEmail">
          <button type="submit"><add-friend-icon /></button>
        </form>
      </section>
      <section v-if="allFriends?.length">
        <h2 class="center">{{ t("Current_Friends")}}:</h2>
        <table>
          <tbody>
            <tr v-for="{ id, name, email } in allFriends" :key="email">
              <th scope="row"><user-icon />{{ name }}</th>
              <td class="crop">{{ email }}</td>
              <td><button type="button" @click="deleteFriend(name, id)" class="secondary"><remove-friend-icon /></button></td>
            </tr>
          </tbody>
        </table>
      </section>
      <section v-else class="empty-list">
        <p>{{ t("No_Friends") }}</p>
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
  color: var(--color-text);
  background: var(--color-background-dim);
  font: inherit;
}

.friends-content table {
  width: 100%;
  border-collapse: collapse;
  line-height: 3;
}

.friends-content th svg {
  margin-right: 0.5rem;
  vertical-align: sub;
}

.friends-content h2 svg {
  margin-right: 0.2rem;
  vertical-align: baseline;
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

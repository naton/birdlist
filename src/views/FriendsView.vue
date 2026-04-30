<script setup>
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "../stores/settings.js";
import { useFriendsStore } from "../stores/friends.js";
import AddFriendIcon from "@/shared/icons/AddFriendIcon.vue";
import UserIcon from "@/shared/icons/UserIcon.vue";
import RemoveFriendIcon from "@/shared/icons/RemoveFriendIcon.vue";

const settingsStore = useSettingsStore();
const { t } = settingsStore;

const friendsStore = useFriendsStore();
const { addFriend, deleteFriend } = friendsStore;
const { allFriends } = storeToRefs(friendsStore);

const newFriendName = ref();
const newFriendEmail = ref();

function addFriendAndReset(name, email) {
  addFriend(name, email);
  newFriendName.value = "";
  newFriendEmail.value = "";
}
</script>

<template>
  <div class="friends">
    <article class="friends-content page-content">
      <section>
        <h1 class="center margin-bottom">{{ t("Friends") }}</h1>
        <details class="help margin-top margin-bottom">
          <summary>{{ t("What_Is_This") }}</summary>
          <p class="margin-left">{{ t("Friends_Help") }}</p>
        </details>
      </section>
      <section>
        <h2 class="icon-label">
          <user-icon />
          {{ t("Add_Friend") }}...
        </h2>
        <form @submit.prevent="addFriendAndReset(newFriendName, newFriendEmail)" class="margin-top inline-form">
          <input v-model="newFriendName" type="text" required placeholder="Namn" />
          <input v-model="newFriendEmail" type="email" required placeholder="E-postadress" />
          <button type="submit"><add-friend-icon /></button>
        </form>
      </section>
      <section v-if="allFriends?.length">
        <h2 class="center">{{ t("Current_Friends") }}:</h2>
        <table class="data-table">
          <tbody>
            <tr v-for="{ id, name, email } in allFriends" :key="email">
              <th scope="row"><user-icon />{{ name }}</th>
              <td class="cell-crop">{{ email }}</td>
              <td>
                <button type="button" class="secondary" @click="deleteFriend(name, id)">
                  <remove-friend-icon />
                </button>
              </td>
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
.friends-content table {
  line-height: 3;
}

.friends-content th svg {
  margin-right: 0.5rem;
  vertical-align: sub;
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
.cell-crop {
  max-width: 40vw;
}
</style>

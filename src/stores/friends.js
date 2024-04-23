import { ref } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { db } from "../db";
import { liveQuery } from "dexie";
import { useSettingsStore } from "./settings.js";
import { useMessagesStore } from "./messages.js";

export const useFriendsStore = defineStore("friend", () => {
  const settingsStore = useSettingsStore();
  const { t } = settingsStore;
  const { currentUser } = storeToRefs(settingsStore);

  const messagesStore = useMessagesStore();
  const { addMessage } = messagesStore;

  const allFriends = ref([]);

  /* Friends */
  liveQuery(async () => await db.friends.toArray()).subscribe(
    (friends) => {
      allFriends.value = friends;
    },
    (error) => {
      console.log(error);
    }
  );

  function isMe(email) {
    return email === currentUser.value.email;
  }

  function getFriendlyName(email) {
    if (isMe(email)) {
      return t("Me");
    }
    return allFriends.value.find(f => f.email === email)?.name || email;
  }

  async function addFriend(name, email) {
    await db.friends.add({
      name: name.trim(),
      email: email.trim(),
    });
    addMessage(name + " " + t("Was_Added"));
  }
  
  async function deleteFriend(name, id) {
    await db.friends.delete(id);
    addMessage(name + " " + t("Was_Removed"));
  }

  return {
    allFriends,
    getFriendlyName,
    addFriend,
    deleteFriend,
  };
});

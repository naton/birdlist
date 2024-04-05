import { ref } from "vue";
import { defineStore } from "pinia";
import { db } from "../db";
import { liveQuery } from "dexie";

export const useFriendsStore = defineStore("friend", () => {
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

  function getFriendlyName(email) {
    return allFriends.value.find(f => f.email === email)?.name || email;
  }

  async function addFriend(name, email) {
    await db.friends.add({
      name: name.trim(),
      email: email.trim(),
    });
  }

  async function deleteFriend(id) {
    await db.friends.delete(id);
  }

  return {
    allFriends,
    getFriendlyName,
    addFriend,
    deleteFriend,
  };
});

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
    addFriend,
    deleteFriend,
  };
});

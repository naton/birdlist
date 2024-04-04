import { ref } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { db } from "../db";
import { liveQuery } from "dexie";
import { useListsStore } from "./lists.js";

export const useCommentsStore = defineStore("comment", () => {
  const listsStore = useListsStore();
  const { currentList } = storeToRefs(listsStore);

  const allComments = ref([]);

  /* Comments */
  liveQuery(async () => await db.comments.toArray()).subscribe(
    (comments) => {
      allComments.value = comments.sort((a, b) => b.date - a.date);
    },
    (error) => {
      console.log(error);
    }
  );

  async function addComment(payload) {
    await db.comments.add({
      comment: payload.comment,
      userId: payload.user,
      date: new Date(),
      realmId: currentList.value ? currentList.value.realmId : undefined,
      listId: payload.listId,
    });
  }

  return {
    allComments,
    addComment,
  };
});

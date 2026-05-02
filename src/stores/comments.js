import { ref, computed } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { db } from "../db";
import { liveQuery } from "dexie";
import { savePublicComment } from "@/helpers";
import { useMessagesStore } from "./messages.js";
import { useSettingsStore } from "./settings.js";
import { useListsStore } from "./lists.js";

export const useCommentsStore = defineStore("comment", () => {
  const messagesStore = useMessagesStore();
  const { addMessage } = messagesStore;

  const settingsStore = useSettingsStore();
  const { t } = settingsStore;
  const { currentUser } = storeToRefs(settingsStore);

  const listsStore = useListsStore();
  const { isPublicList } = listsStore;
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

  const allMyComments = computed(() => allComments.value.filter((comment) => comment.userId == currentUser.value.userId));

  function getCurrentUserAliases() {
    return [
      currentUser.value?.userId,
      currentUser.value?.email,
      currentUser.value?.name,
    ].filter((value) => value && value !== "unauthorized");
  }

  async function addComment(payload) {
    const list = currentList.value;
    const comment = String(payload.comment || "").trim();
    const ownerAliases = getCurrentUserAliases();
    const owner = payload.user || ownerAliases[0] || "unauthorized";

    if (!comment || !payload.listId || !list) {
      return false;
    }

    const row = {
      comment: payload.comment,
      owner,
      userId: owner,
      date: new Date(),
      realmId: list.realmId,
      listId: payload.listId,
    };

    try {
      if (isPublicList(list)) {
        const result = await savePublicComment({
          ...row,
          ownerAliases,
        });

        if (!result?.success) {
          addMessage(result?.message || t("Failed_To_Save_Comment"));
          return false;
        }

        if (typeof db.cloud?.sync === "function") {
          await db.cloud.sync({ wait: true });
        }
        return true;
      }

      await db.comments.add(row);
      return true;
    } catch (error) {
      console.error("Failed to add comment.", error);
      addMessage(t("Failed_To_Save_Comment"));
      return false;
    }
  }

  return {
    allComments,
    allMyComments,
    addComment,
  };
});

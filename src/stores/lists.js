import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { defineStore, storeToRefs } from "pinia";
import { db } from "../db";
import { liveQuery } from "dexie";
import { getTiedRealmId } from "dexie-cloud-addon";
import { useSettingsStore } from "./settings";
import { useMessagesStore } from "./messages";

export const useListsStore = defineStore("list", () => {
  const messagesStore = useMessagesStore();
  const { addMessage } = messagesStore;

  const route = useRoute();
  const router = useRouter();

  const settingsStore = useSettingsStore();
  const { currentUser, isUserLoggedIn } = storeToRefs(settingsStore);
  const { t } = settingsStore;

  const allLists = ref([]);
  const joinedListIds = ref([]);
  function getCurrentOwnerAliases() {
    return [
      currentUser.value?.userId,
      currentUser.value?.name,
      currentUser.value?.email,
    ].filter(Boolean);
  }

  function isOwnedByCurrentUser(list) {
    if (!list?.owner) {
      return false;
    }
    return getCurrentOwnerAliases().includes(list.owner);
  }

  function isPublicList(list) {
    return list?.realmId === "rlm-public";
  }

  function isJoinedList(listId) {
    return joinedListIds.value.includes(String(listId));
  }

  function canWriteToList(list) {
    if (!list) {
      return false;
    }

    if (!isPublicList(list)) {
      return true;
    }

    if (isOwnedByCurrentUser(list)) {
      return true;
    }

    return Boolean(isUserLoggedIn.value && isJoinedList(list.id));
  }

  async function joinPublicList(listId) {
    const normalizedListId = String(listId ?? "").trim();
    if (!normalizedListId) {
      return false;
    }

    const list = allLists.value?.find((item) => String(item.id) === normalizedListId);
    if (!list || !isPublicList(list) || isOwnedByCurrentUser(list)) {
      return false;
    }

    if (!isUserLoggedIn.value) {
      addMessage(t("You_Need_To_Login_First"));
      return false;
    }

    const userId = currentUser.value?.userId;
    if (!userId || userId === "unauthorized") {
      addMessage(t("You_Need_To_Login_First"));
      return false;
    }

    try {
      const existing = await db.joinedLists.where("[userId+listId]").equals([userId, normalizedListId]).first();
      if (existing?.id) {
        await db.joinedLists.update(existing.id, { updated: new Date() });
      } else {
        await db.joinedLists.add({
          userId,
          listId: normalizedListId,
          joinedAt: new Date(),
          updated: new Date(),
        });
      }

      addMessage(t("List_Joined"));
      return true;
    } catch (error) {
      console.error("Failed to join list.", error);
      addMessage(t("List_Join_Failed"));
      return false;
    }
  }

  async function leavePublicList(listId) {
    const normalizedListId = String(listId ?? "").trim();
    if (!normalizedListId) {
      return false;
    }

    const list = allLists.value?.find((item) => String(item.id) === normalizedListId);
    if (!list || !isPublicList(list) || isOwnedByCurrentUser(list)) {
      return false;
    }

    const userId = currentUser.value?.userId;
    if (!userId || userId === "unauthorized") {
      return false;
    }

    try {
      const existing = await db.joinedLists.where("[userId+listId]").equals([userId, normalizedListId]).toArray();
      if (existing.length > 0) {
        await db.joinedLists.bulkDelete(existing.map((item) => item.id).filter(Boolean));
      }
      addMessage(t("List_Left"));
      return true;
    } catch (error) {
      console.error("Failed to leave list.", error);
      addMessage(t("List_Leave_Failed"));
      return false;
    }
  }

  const allMyLists = computed(() => allLists.value?.filter((list) => isOwnedByCurrentUser(list)) || []);
  const allMineLists = computed(
    () =>
      allLists.value?.filter(
        (list) => !isPublicList(list) || isOwnedByCurrentUser(list) || isJoinedList(list.id)
      ) || []
  );
  const allPublicLists = computed(
    () => allLists.value?.filter((list) => isPublicList(list)) || []
  );
  const currentSort = ref("bydate");
  const currentListExpanded = ref(true);
  const currentList = ref();
  const lastUsedList = ref();
  const checkListEditMode = ref(false);

  /* Lists */
  liveQuery(async () => await db.lists.toArray()).subscribe(
    (lists) => {
      // sort all lists by id, latest first
      allLists.value = lists.sort((a, b) => b.updated - a.updated);
      currentList.value = allLists.value.find((list) => list.id == route.params.id);
      // if last used list is deleted, reset it
      if (lastUsedList.value && !allLists.value.find((list) => list.id == lastUsedList.value.id)) {
        lastUsedList.value = null;
      }
    },
    (error) => {
      console.log(error);
    }
  );

  liveQuery(async () => {
    const userId = currentUser.value?.userId;
    if (!userId || userId === "unauthorized") {
      return [];
    }
    return db.joinedLists.where({ userId }).toArray();
  }).subscribe(
    (joinedLists) => {
      joinedListIds.value = joinedLists.map((item) => String(item.listId));
    },
    (error) => {
      console.log(error);
    }
  );

  function sortBy(val) {
    return (currentSort.value = val);
  }

  async function createList(payload) {
    // Insert the list in the db with title and descripton
    const newId = await db.lists.add(payload);
    lastUsedList.value = currentList.value = allLists.value.find((list) => list.id == newId);
    return newId;
  }

  async function updateList(payload, callback) {
    if (!payload?.id) {
      return;
    }

    const { id, ...changes } = payload;

    await db.transaction("rw", [db.lists], async () => {
      await db.lists.update(id, changes);
    });
    if (callback) {
      callback();
    }
  }

  async function convertToChecklist(list) {
    let newList = { ...list };
    delete newList.id;
    newList.type = "checklist";
    const listObservations = await db.observations.where({ listId: list.id }).toArray();
    newList.birds = listObservations.map((obs) => obs.name);
    const newId = await createList(newList);
    router.push({ name: "list", params: { id: newId} });
    addMessage(t("Checklist_Created") + ": <b>" + list.title + "</b>");
  }

  async function deleteList(listId) {
    let deleteRelatedObservations = false;
  
    if (confirm(t("Are_You_Sure_You_Want_To_Delete_This_List"))) {
      deleteRelatedObservations = confirm(t("Delete_The_Lists_Observations_As_Well"));
  
      await db
        .transaction("rw", [db.lists, db.observations, db.realms, db.members, db.joinedLists], () => {
          if (deleteRelatedObservations) {
            // Delete possible observations:
            db.observations.where({ listId: listId }).delete();
          }
          // Delete the list:
          db.lists.delete(listId);
          // Remove joined references:
          db.joinedLists.where({ listId }).delete();
          // Delete possible realm and its members in case list was shared:
          const tiedRealmId = getTiedRealmId(listId);
          // Empty out any tied realm from members:
          db.members.where({ realmId: tiedRealmId }).delete();
          // Delete the tied realm if it exists:
          db.realms.delete(tiedRealmId);
        })
        .then(() => {
          document.location.hash = "";
        });
      lastUsedList.value = null;
      router.push({ name: "lists" });
    }
  }

  async function getMembersByListId(listId) {
    const realmId = getTiedRealmId(listId);
    return await db.members.where({ realmId }).toArray();
  }

  async function getListMembers(listId) {
    const members = await getMembersByListId(listId);
    // add myself
    members.push({ email: currentUser.value.email, accepted: true });
    // filter accepted members and remove duplicates
    return members.filter((member, index, self) => 
      self.findIndex(m => m.email === member.email && m.email) === index && member.accepted)
      .sort((a, b) => a.email.localeCompare(b.email));
  }  

  async function shareBirdList(listId, listName, friends) {
    if (!listId) return;
  
    await db.transaction("rw", [db.lists, db.observations, db.comments, db.realms, db.members], async () => {
      // Add or update a realm, tied to the list using getTiedRealmId():
      const realmId = getTiedRealmId(listId);
  
      await db.realms.put({
        realmId,
        name: listName,
        represents: "a bird list",
      });
  
      // Move list into the realm (if not already there):
      await db.lists.update(listId, { realmId });
      // Move all items into the new realm consistently (modify() is consistent across sync peers)
      await db.observations.where({ listId: listId }).modify({ realmId: realmId });
      await db.comments.where({ listId: listId }).modify({ realmId: realmId });
      // Add the members to share it to:
      db.members.bulkAdd(
        [...friends].map((friend) => ({
          realmId,
          email: friend.email,
          invite: true, // Generates invite email on server on sync
          permissions: {
            add: ["observations", "comments"],
            update: {
              observations: ["*", "realmId"],
            },
            // manage: "*", // Give your friend full permissions within this new realm.
          },
        }))
      );
    });
  }

  return {
    allLists,
    allMyLists,
    allMineLists,
    allPublicLists,
    joinedListIds,
    currentList,
    lastUsedList,
    checkListEditMode,
    currentListExpanded,
    currentSort,
    isOwnedByCurrentUser,
    isPublicList,
    isJoinedList,
    canWriteToList,
    joinPublicList,
    leavePublicList,
    sortBy,
    getListMembers,
    createList,
    updateList,
    convertToChecklist,
    deleteList,
    shareBirdList,
  };
},
{
  persist: {
    key: "birdlist-lists",
    paths: ["currentList", "lastUsedList", "currentSort", "currentListExpanded"],
  },
});

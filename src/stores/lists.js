import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { defineStore, storeToRefs } from "pinia";
import { db } from "../db";
import { liveQuery } from "dexie";
import { getTiedRealmId } from "dexie-cloud-addon";
import { useSettingsStore } from "./settings";

export const useListsStore = defineStore("list", () => {
  const route = useRoute();
  const router = useRouter();

  const settingsStore = useSettingsStore();
  const { currentUser } = storeToRefs(settingsStore);
  const { t } = settingsStore;

  const allLists = ref(null);
  const allMyLists = computed(() => allLists.value?.filter((list) => list.owner == currentUser.value?.name) || []);
  const currentSort = ref("bydate");
  const currentListExpanded = ref(true);
  const currentList = ref();
  const lastUsedList = ref();
  const checkListEditMode = ref(false);
  const isSubscribedToNotifications = ref(false);

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
    await db.transaction("rw", [db.lists], async () => {
      await db.lists.where({ id: payload.id }).modify(payload);
    });
    if (callback) {
      callback();
    }
  }

  async function deleteList(listId) {
    let deleteRelatedObservations = false;
  
    if (confirm(t("Are_You_Sure_You_Want_To_Delete_This_List"))) {
      deleteRelatedObservations = confirm(t("Delete_The_Lists_Observations_As_Well"));
  
      await db
        .transaction("rw", [db.lists, db.observations, db.realms, db.members], () => {
          if (deleteRelatedObservations) {
            // Delete possible observations:
            db.observations.where({ listId: listId }).delete();
          }
          // Delete the list:
          db.lists.delete(listId);
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
    currentList,
    lastUsedList,
    checkListEditMode,
    currentListExpanded,
    currentSort,
    isSubscribedToNotifications,
    sortBy,
    getListMembers,
    createList,
    updateList,
    deleteList,
    shareBirdList,
  };
},
{
  persist: {
    key: "birdlist-lists",
    paths: ["currentList", "lastUsedList", "isSubscribedToNotifications", "currentSort", "currentListExpanded"],
  },
});

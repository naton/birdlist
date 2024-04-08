import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { defineStore } from "pinia";
import { db } from "../db";
import { liveQuery } from "dexie";
import { getTiedRealmId } from "dexie-cloud-addon";

export const useListsStore = defineStore("list", () => {
  const route = useRoute();
  const router = useRouter();

  const allLists = ref(null);
  const currentSort = ref("bydate");
  const currentListExpanded = ref(true);
  const currentList = ref();
  const lastUsedList = ref();

  /* Lists */
  liveQuery(async () => await db.lists.toArray()).subscribe(
    (lists) => {
      allLists.value = lists;
      currentList.value = allLists.value.find((list) => list.id == route.params.id);
    },
    (error) => {
      console.log(error);
    }
  );

  function sortBy(val) {
    return (currentSort.value = val);
  }

  async function createList(title, description, type = "normal") {
    // Insert the list in the db with title and descripton
    const newId = await db.lists.add({
      title,
      description,
      type
    });
    currentList.value = allLists.value.find((list) => list.id == newId);
    return newId;
  }

  async function updateList(list, callback) {
    await db.transaction("rw", [db.lists], async () => {
      await db.lists.where({ id: list.id }).modify({
        title: list.title,
        description: list.description,
        type: list.type,
        startDate: list.startDate,
        endDate: list.endDate,
        reportInterval: list.reportInterval,
      });
    });
    if (callback) {
      callback();
    }
  }

  async function deleteList(listId) {
    let deleteRelatedObservations = false;
  
    if (confirm("Är du säker på att du vill ta bort denna lista?")) {
      deleteRelatedObservations = confirm("Radera även listans observationer?");
  
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

      router.push({ name: "lists" });
    }
  }

  async function getListMembers(listId) {
    const realmId = getTiedRealmId(listId);
    return await db.members.where({ realmId }).toArray();
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
    currentList,
    lastUsedList,
    currentListExpanded,
    currentSort,
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
    paths: ["currentList", "lastUsedList", "currentSort", "currentListExpanded"],
  },
});

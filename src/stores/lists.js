import { ref } from "vue";
import { defineStore } from "pinia";
import { db } from "../db";
import { liveQuery } from "dexie";
import { getTiedRealmId } from "dexie-cloud-addon";

export const useListsStore = defineStore("list", () => {
  const myLists = ref(null);
  const currentList = ref("monthly");
  const currentSort = ref("bydate");

  /* Lists */
  liveQuery(async () => await db.lists.toArray()).subscribe(
    (lists) => {
      myLists.value = lists;
    },
    (error) => {
      console.log(error);
    }
  );

  function sortBy(val) {
    return (currentSort.value = val);
  }

  async function shareBirdList(listId, listName) {
    let email = prompt("Ange e-postadressen till personen du vill dela denna lista med:");
  
    if (!email) return;
  
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
      await db.members.add({
        realmId,
        email: email,
        invite: true, // Generates invite email on server on sync
        permissions: {
          add: ["observations", "comments"],
          update: {
            observations: ["*", "realmId"],
          },
          // manage: "*", // Give your friend full permissions within this new realm.
        },
      });
    });
  }

  return {
    myLists,
    currentList,
    currentSort,
    sortBy,
    shareBirdList
  };
});

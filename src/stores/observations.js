import { ref, computed } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { db } from "../db";
import { liveQuery } from "dexie";
import { useSettingsStore } from "./settings.js";
import { useListsStore } from "./lists.js";

export const useObservationsStore = defineStore("observation", () => {
  const settingsStore = useSettingsStore();
  const { currentUser, currentYear, currentMonth } = storeToRefs(settingsStore);

  const listsStore = useListsStore();
  const { currentList } = storeToRefs(listsStore);

  const allObservations = ref([]);
  const lastLockedObservation = ref("");
  
  liveQuery(async () => await db.observations.toArray()).subscribe(
    (observations) => {
      allObservations.value = observations;
    },
    (error) => {
      console.log(error);
    }
  );

  const allMyObservations = computed(() => {
    return allObservations.value
      .filter((obs) => obs.owner == currentUser.value?.name || obs.owner == "unauthorized")
      .filter((obs) => obs.date.getFullYear() == currentYear.value)
      .sort((a, b) => a.date - b.date);
  });

  const allThisMonth = computed(() => {
    return allObservations.value
      .filter(
        (obs) =>
          (obs.owner == currentUser.value?.name || obs.owner == "unauthorized") &&
          obs.date.getFullYear() == currentYear.value &&
          obs.date.getMonth() == currentMonth.value
      )
      .sort((a, b) => a.date - b.date);
  });

  const allListObservations = computed(() => {
    const listId = currentList.value?.id;
    return allObservations.value.filter((obs) => obs.listId == listId);
  });

  function getTotalPerMonth(month) {
    return allObservations.value.filter(
      (obs) =>
        (obs.owner == currentUser.value?.name || obs.owner == "unauthorized") &&
        obs.date.getFullYear() == currentYear.value &&
        obs.date.getMonth() == month
    ).length;
  }  

  async function addObservation(bird, location) {
    let date = new Date();
    const isBatchImport = bird.includes(","); // Probably multiple birds
    const hasCustomDate = bird.startsWith("20") && bird.includes(":"); // Probably a date
  
    if (hasCustomDate) {
      const customDate = new Date(bird.split(":")[0]);
      date = isNaN(customDate) ? new Date() : customDate;
      bird = bird.split(":")[1];
    }
  
    async function add(bird) {
      await db.observations.add({
        name: bird.trim(),
        date: date,
        realmId: currentList.value ? currentList.value.realmId : undefined,
        listId: currentList.value ? currentList.value.id : undefined, // Any ID other than defaults are valid here
        location: location,
      });
    }
  
    if (isBatchImport) {
      const birds = bird.split(",");
      birds.forEach(async (bird) => add(bird));
    } else {
      add(bird);
    }
  }

  async function saveObservation(obs) {
    let payload = {
      name: obs.name.trim(),
      date: obs.date,
      location: obs.location,
      locked: obs.locked,
    };
    if (obs.listId) {
      payload.listId = obs.listId;
    }
    await db.transaction("rw", [db.lists, db.observations], async () => {
      await db.observations.update(obs, payload);
      await db.observations.where({ listId: payload.listId }).modify({ realmId: payload.realmId });
      // Move list into the realm (if not already there):
      await db.lists.update(payload.listId, { realmId: payload.realmId });
    });
  }

  async function lockObservation(obsId, allObservationsInGroup) {
    await db.observations.bulkUpdate(
      [...allObservationsInGroup].map((obs) => ({
        key: obs.id,
        changes: { locked: obs.id === obsId ? true : false },
      })),
    );
    lastLockedObservation.value = obsId;
  }

  async function deleteObservation(id) {
    await db.observations.delete(id);
  }

  return {
    currentYear,
    currentMonth,
    allThisMonth,
    allMyObservations,
    allListObservations,
    lastLockedObservation,
    getTotalPerMonth,
    addObservation,
    saveObservation,
    lockObservation,
    deleteObservation,
  };
},
{
  persist: {
    key: "birdlist-observations",
    paths: ["currentMonth", "lastLockedObservation"],
  },
});

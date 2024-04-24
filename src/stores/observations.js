import { ref, computed } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { db } from "../db";
import { liveQuery } from "dexie";
import { useMessagesStore } from "./messages.js";
import { useSettingsStore } from "./settings.js";
import { useListsStore } from "./lists.js";
import { pushNewBirdAlert } from "../helpers"

export const useObservationsStore = defineStore("observation", () => {
  const messagesStore = useMessagesStore();
  const { addMessage } = messagesStore;

  const settingsStore = useSettingsStore();
  const { t } = settingsStore;
  const { currentUser, currentYear, currentMonth } = storeToRefs(settingsStore);

  const listsStore = useListsStore();
  const { currentList } = storeToRefs(listsStore);

  const allObservations = ref([]);
  
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

  function isFirstObservationToday() {
    const today = new Date();
    return allMyObservations.value.filter(
      (obs) => obs.date.toISOString().substring(0, 10) === today.toISOString().substring(0, 10)
    ).length === 0;
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
  
    async function add(bird, list = currentList.value) {
      if (isFirstObservationToday()) {
        addMessage(t("First_Observation_Today") + " – " + bird.trim());
      } else {
        addMessage(t("New_Observation_Added") + ": " + bird.trim());
      }

      await db.observations.add({
        name: bird.trim(),
        date: date,
        realmId: list ? list.realmId : undefined,
        listId: list ? list.id : undefined, // Any ID other than defaults are valid here
        location: location,
      });

      // Push notification to all members of the list
      if (list) {
        pushNewBirdAlert({
          title: t("New_Observation_Added") + ": " + bird.trim(),
          icon: "https://birdlist.app/192x192.png",
          body: t("List") + ": " + list.name,
          listId: list.id,
        })
      }
    }
  
    if (isBatchImport) {
      const birds = bird.split(",");
      birds.forEach(async (bird) => add(bird));
    } else {
      add(bird);
    }

    if (currentList.value) {
      await db.lists.where({ id: currentList.value.id }).modify({ updated: new Date() });
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
    // check if this observation is already added to the current list and has been locked
    if (allListObservations.value.filter((obs) => obs.id === obsId && obs.locked).length > 0) {
      addMessage(t("Observation_Already_Added"));
      return;
    }

    await db.observations.bulkUpdate(
      [...allObservationsInGroup].map((obs) => ({
        key: obs.id,
        changes: { locked: obs.id === obsId ? true : false },
      })),
    );

    addMessage(t("Observation_Locked"));
  }

  async function deleteObservation(id) {
    // get the bird name of the observation to be deleted
    const birdName = allMyObservations.value.filter((obs) => obs.id === id)[0].name;
    await db.observations.delete(id);
    addMessage(t("Observation_Removed") + ": " + birdName);
  }

  return {
    currentYear,
    currentMonth,
    allThisMonth,
    allMyObservations,
    allListObservations,
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
    paths: ["currentMonth"],
  },
});

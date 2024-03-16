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
  const currentObservation = ref({});
  
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
    const listId = currentList.value.id;
    return allObservations.value.filter((obs) => obs.listId == listId);
  });

  async function addObservation(bird, location) {
    console.log(bird, location)
    const isCalculatedList = currentList.value.id == "monthly" || currentList.value.id == "everything";
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
        realmId: isCalculatedList ? undefined : currentList.value.realmId,
        listId: isCalculatedList ? undefined : currentList.value.id, // Any ID other than defaults are valid here
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

  function selectObservation(obs) {
    currentObservation.value = obs;
  }

  function editObservation(obs) {
    currentObservation.value = obs;
//    editDialog.value.showModal();
  }

  async function deleteObservation(id) {
    db.observations.delete(id);
  }

  return {
    currentYear,
    currentMonth,
    currentObservation,
    allThisMonth,
    allMyObservations,
    allListObservations,
    addObservation,
    editObservation,
    deleteObservation,
    selectObservation,
  };
});

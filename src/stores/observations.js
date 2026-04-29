import { ref, computed } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { db } from "../db";
import { liveQuery } from "dexie";
import { useMessagesStore } from "./messages.js";
import { useSettingsStore } from "./settings.js";
import { useListsStore } from "./lists.js";
import { pushNewBirdAlert, savePublicObservation } from "../helpers";
import { getBirdDisplayName, getBirdKey, getBirdLatinName, getBirdStorageName, normalizeBirdName } from "@/birdNames.js";

export const useObservationsStore = defineStore(
  "observation",
  () => {
    const messagesStore = useMessagesStore();
    const { addMessage } = messagesStore;

    const settingsStore = useSettingsStore();
    const { t } = settingsStore;
    const { currentUser, currentYear, currentMonth, lang } = storeToRefs(settingsStore);

    const listsStore = useListsStore();
    const { canWriteToList, isPublicList } = listsStore;
    const { currentList } = storeToRefs(listsStore);

    const allObservations = ref([]);

    function getCurrentOwnerAliases() {
      const aliases = [
        currentUser.value?.userId,
        currentUser.value?.name,
        currentUser.value?.email,
      ].filter(Boolean);

      if (currentUser.value?.userId === "unauthorized") {
        aliases.push("unauthorized");
      }

      return aliases;
    }

    function collectCurrentUserAliases(value, aliases = new Set(), key = "") {
      if (value === null || value === undefined) {
        return aliases;
      }

      if (typeof value === "string") {
        const keyLooksLikeIdentity = ["userId", "name", "email", "sub", "preferred_username"].includes(key);
        const valueLooksLikeIdentity = value.includes("@");
        const normalized = value.trim();
        if (normalized && normalized !== "unauthorized" && (keyLooksLikeIdentity || valueLooksLikeIdentity)) {
          aliases.add(normalized);
        }
        return aliases;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => collectCurrentUserAliases(item, aliases));
        return aliases;
      }

      if (typeof value === "object") {
        for (const [childKey, childValue] of Object.entries(value)) {
          collectCurrentUserAliases(childValue, aliases, childKey);
        }
      }

      return aliases;
    }

    function getCurrentUserAliases() {
      return [...collectCurrentUserAliases(currentUser.value)];
    }

    function isCurrentUsersObservation(obs) {
      return getCurrentOwnerAliases().includes(obs.owner);
    }

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
        .filter((obs) => isCurrentUsersObservation(obs))
        .filter((obs) => obs.date.getFullYear() == currentYear.value)
        .sort((a, b) => a.date - b.date);
    });

    const allThisMonth = computed(() => {
      return allObservations.value
        .filter(
          (obs) =>
            isCurrentUsersObservation(obs) &&
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
          isCurrentUsersObservation(obs) &&
          obs.date.getFullYear() == currentYear.value &&
          obs.date.getMonth() == month
      ).length;
    }

    function isFirstObservationToday() {
      const today = new Date();
      return (
        allMyObservations.value.filter(
          (obs) => obs.date.toISOString().substring(0, 10) === today.toISOString().substring(0, 10)
        ).length === 0
      );
    }

    function observationIsANewSpeciesForThisList(bird) {
      const birdKey = getBirdKey(bird);
      return allListObservations.value.filter((obs) => getBirdKey(obs) === birdKey).length === 0;
    }

    let pushTimer = null;

    async function addObservation(bird, location) {
      if (!bird || (typeof bird === "object" && !bird.name && !bird.latinName)) {
        return false;
      }

      let date = new Date();
      const rawBirdName = typeof bird === "string" ? bird : bird.name;
      const isBatchImport = typeof bird === "string" && bird.includes(","); // Probably multiple birds
      const hasCustomDate = typeof bird === "string" && bird.startsWith("20") && bird.includes(":"); // Probably a date

      if (hasCustomDate) {
        const customDate = new Date(rawBirdName.split(":")[0]);
        date = isNaN(customDate) ? new Date() : customDate;
        bird = rawBirdName.split(":")[1];
      }

      const list = currentList.value;
      if (list && !canWriteToList(list)) {
        addMessage(t("List_Is_Read_Only_For_You"));
        return false;
      }

      async function addSingleObservation(birdInput) {
        const storageName = getBirdStorageName(birdInput, lang?.value || "en");
        const latinName = getBirdLatinName(birdInput);
        if (!storageName) {
          return false;
        }

        const firstToday = isFirstObservationToday();
        const isNewSpecies = observationIsANewSpeciesForThisList(latinName ? { latinName } : storageName);

        try {
          const observation = {
            name: storageName,
            date,
            realmId: list ? list.realmId : undefined,
            listId: list ? list.id : undefined, // Any ID other than defaults are valid here
            location,
          };

          if (latinName) {
            observation.latinName = latinName;
          }

          if (list && isPublicList(list)) {
            const ownerAliases = getCurrentUserAliases();
            const result = await savePublicObservation({
              ...observation,
              owner: ownerAliases[0] || "unauthorized",
              ownerAliases,
            });

            if (!result?.success) {
              addMessage(result?.message || t("Failed_To_Save_Observation"));
              return false;
            }

            if (typeof db.cloud?.sync === "function") {
              await db.cloud.sync({ wait: true });
            }
          } else {
            await db.observations.add(observation);
          }

          if (firstToday) {
            addMessage(t("First_Observation_Today") + " - <b>" + storageName + "</b>");
          } else if (isNewSpecies) {
            addMessage(t("New_Species_Added") + ": <b>" + storageName + "</b>");
          } else {
            addMessage(t("New_Observation_Added") + ": <b>" + storageName + "</b>");
          }

          // Push notification to all members of the list
          if (list) {
            clearTimeout(pushTimer);
            pushTimer = setTimeout(() => {
              pushNewBirdAlert({
                title: t("New_Observation_Added") + ": " + storageName,
                options: {
                  icon: "https://birdlist.app/192x192.png",
                  body: t("List") + ": " + (list.title || list.name || ""),
                  tag: "list-" + list.id,
                  data: {
                    listId: list.id,
                  },
                },
              });
            }, 2000);
          }

          return true;
        } catch (error) {
          console.error("Failed to add observation.", error);
          addMessage(t("Failed_To_Save_Observation"));
          return false;
        }
      }

      let hasSavedAtLeastOne = false;
      if (isBatchImport) {
        const birds = rawBirdName.split(",");
        for (const birdName of birds) {
          const didSave = await addSingleObservation(birdName);
          hasSavedAtLeastOne = hasSavedAtLeastOne || didSave;
        }
      } else {
        hasSavedAtLeastOne = await addSingleObservation(bird);
      }

      if (hasSavedAtLeastOne && currentList.value && !isPublicList(currentList.value)) {
        await db.lists.where({ id: currentList.value.id }).modify({ updated: new Date() });
      }

      return hasSavedAtLeastOne;
    }

    async function saveObservation(obs) {
      let payload = {
        name: getBirdDisplayName(obs, lang?.value || "en").trim(),
        date: obs.date,
        location: obs.location,
        locked: obs.locked,
      };
      const latinName = obs.latinName || getBirdLatinName(obs.name);
      if (latinName) {
        payload.latinName = latinName;
      } else if (obs.name) {
        payload.name = normalizeBirdName(obs.name) ? obs.name.trim() : payload.name;
      }
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
          changes: { locked: obs.id === obsId },
        }))
      );

      addMessage(t("Observation_Locked"));
    }

    async function deleteObservation(id) {
      const observation = allObservations.value.find((obs) => obs.id === id);
      const birdName = observation?.name;
      await db.observations.delete(id);
      if (birdName) {
        addMessage(t("Observation_Removed") + ": <b>" + birdName + "</b>");
      } else {
        addMessage(t("Observation_Removed"));
      }
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
      paths: [],
    },
  }
);

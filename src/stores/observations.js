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
    const { allLists, currentList } = storeToRefs(listsStore);

    const allObservations = ref([]);

    function toObservationDate(value) {
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
      }

      if (value?.$t === "Date" && value?.v) {
        const date = new Date(value.v);
        return Number.isNaN(date.getTime()) ? null : date;
      }

      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    function observationDateMatches(obs, year, month = null) {
      const date = toObservationDate(obs?.date);
      if (!date || date.getFullYear() !== year) {
        return false;
      }

      return month === null || date.getMonth() === month;
    }

    function getObservationTime(obs) {
      return toObservationDate(obs?.date)?.getTime() || 0;
    }

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
        .filter((obs) => observationDateMatches(obs, currentYear.value))
        .sort((a, b) => getObservationTime(a) - getObservationTime(b));
    });

    const allThisMonth = computed(() => {
      return allObservations.value
        .filter(
          (obs) =>
            isCurrentUsersObservation(obs) &&
            observationDateMatches(obs, currentYear.value, currentMonth.value)
        )
        .sort((a, b) => getObservationTime(a) - getObservationTime(b));
    });

    const allListObservations = computed(() => {
      const listId = currentList.value?.id;
      return allObservations.value.filter((obs) => obs.listId == listId);
    });

    function getTotalPerMonth(month) {
      return allObservations.value.filter(
        (obs) =>
          isCurrentUsersObservation(obs) &&
          observationDateMatches(obs, currentYear.value, month)
      ).length;
    }

    function isFirstObservationToday() {
      const today = new Date();
      return (
        allMyObservations.value.filter(
          (obs) => toObservationDate(obs.date)?.toISOString().substring(0, 10) === today.toISOString().substring(0, 10)
        ).length === 0
      );
    }

    function observationIsANewSpeciesForThisList(bird) {
      const birdKey = getBirdKey(bird);
      return allListObservations.value.filter((obs) => getBirdKey(obs) === birdKey).length === 0;
    }

    async function touchListsUpdated(listIds = []) {
      const updated = new Date();
      for (const listId of new Set(listIds.filter(Boolean))) {
        try {
          await db.lists.update(listId, { updated });
        } catch (error) {
          console.warn(`Skipping list timestamp update for ${listId}.`, error);
        }
      }
    }

    let pushTimer = null;

    async function addObservation(bird, location) {
      if (!bird || (typeof bird === "object" && !bird.name && !bird.latinName)) {
        return false;
      }

      let date = new Date();
      const rawBirdName = typeof bird === "string" ? bird : bird.name;
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

          // Public-list observations are saved by the API, which also sends web push notifications.
          if (list && !isPublicList(list)) {
            clearTimeout(pushTimer);
            pushTimer = setTimeout(async () => {
              try {
                await pushNewBirdAlert({
                  notification: {
                    type: "new-observation",
                    listId: list.id,
                    listTitle: list.title || list.name || "",
                    bird: {
                      name: storageName,
                      latinName,
                    },
                  },
                });
              } catch (error) {
                console.error("Failed to send push alert.", error);
              }
            }, 2000);
          }

          return true;
        } catch (error) {
          console.error("Failed to add observation.", error);
          addMessage(t("Failed_To_Save_Observation"));
          return false;
        }
      }

      const hasSavedAtLeastOne = await addSingleObservation(bird);

      if (hasSavedAtLeastOne && currentList.value && !isPublicList(currentList.value)) {
        await touchListsUpdated([currentList.value.id]);
      }

      return hasSavedAtLeastOne;
    }

    async function saveObservation(obs) {
      const selectedListId = String(obs.listId || "").trim();
      const previousListId = String(obs.previousListId || "").trim();
      const targetList = selectedListId && selectedListId !== "undefined" && selectedListId !== "null"
        ? allLists.value?.find((list) => String(list.id) === selectedListId) ||
          (String(currentList.value?.id) === selectedListId ? currentList.value : null)
        : null;
      const ownerRealmId = obs.owner || currentUser.value?.userId || currentUser.value?.email || currentUser.value?.name;
      let payload = {
        name: getBirdDisplayName(obs, lang?.value || "en").trim(),
        date: obs.date,
        location: obs.location,
        locked: obs.locked,
        listId: targetList ? targetList.id : null,
        realmId: targetList ? targetList.realmId : ownerRealmId || undefined,
      };
      const latinName = obs.latinName || getBirdLatinName(obs.name);
      if (latinName) {
        payload.latinName = latinName;
      } else if (obs.name) {
        payload.name = normalizeBirdName(obs.name) ? obs.name.trim() : payload.name;
      }
      if (targetList && isPublicList(targetList)) {
        const ownerAliases = getCurrentUserAliases();
        const result = await savePublicObservation({
          ...payload,
          id: obs.id,
          owner: ownerAliases[0] || ownerRealmId || "unauthorized",
          ownerAliases,
        });

        if (!result?.success) {
          addMessage(result?.message || t("Failed_To_Save_Observation"));
          return false;
        }

        if (typeof db.cloud?.sync === "function") {
          await db.cloud.sync({ wait: true });
        }

        return true;
      }

      await db.transaction("rw", [db.observations], async () => {
        await db.observations.update(obs, payload);
      });

      await touchListsUpdated([previousListId, targetList?.id]);
      return true;
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

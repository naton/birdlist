import { ref, computed, toRaw, watch } from "vue";
import { storeToRefs } from "pinia";
import { getBirdDisplayName, getBirdKey, getBirdLatinName, getBirdStorageName } from "@/birdNames.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useBirdsStore } from "@/stores/birds.js";
import { useListsStore } from "@/stores/lists.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useMessagesStore } from "@/stores/messages.js";
import { useListUserStats } from "@/composables/useListUserStats.js";

export function useCheckableList(props) {
  const settingsStore = useSettingsStore();
  const { t } = settingsStore;
  const { currentUser, selectedUser, lang, locale } = storeToRefs(settingsStore);

  const birdStore = useBirdsStore();
  const { loadAllBirds } = birdStore;
  const { birds } = storeToRefs(birdStore);

  const listsStore = useListsStore();
  const { updateList } = listsStore;
  const { currentList, checkListEditMode } = storeToRefs(listsStore);

  const observationsStore = useObservationsStore();
  const { addObservation, deleteObservation } = observationsStore;

  const messageStore = useMessagesStore();
  const { addMessage } = messageStore;

  const birdsToCheck = ref([]);
  const addListBirdInput = ref();

  function normalizeBirdForChecklist(bird) {
    const latinName = getBirdLatinName(bird);
    return latinName
      ? { latinName, name: getBirdStorageName(bird, lang?.value || "en") }
      : bird.name;
  }

  function hasBirdInChecklist(birdKey) {
    return birdsToCheck.value.some((item) => getBirdKey(item) === birdKey);
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

  function isCurrentUserOwner(owner) {
    return getCurrentOwnerAliases().includes(owner);
  }

  const checkListBirds = computed(() => {
    const ownersInCurrentList = new Set(props.observations.map((obs) => obs.owner).filter(Boolean));
    const selectedOwner = ownersInCurrentList.has(selectedUser.value) ? selectedUser.value : null;

    return birdsToCheck.value.map((bird) => {
      const birdKey = getBirdKey(bird);
      const hasObservation = props.observations.some((obs) => {
        if (getBirdKey(obs) !== birdKey) {
          return false;
        }

        if (selectedOwner) {
          return obs.owner === selectedOwner;
        }

        return isCurrentUserOwner(obs.owner);
      });

      return {
        name: getBirdDisplayName(bird, lang?.value || "en"),
        latinName: getBirdLatinName(bird),
        key: birdKey,
        checked: hasObservation,
      };
    });
  });

  function addListBird(bird) {
    if (props.readOnly) {
      return;
    }

    const birdKey = getBirdKey(bird);
    if (hasBirdInChecklist(birdKey)) {
      addMessage(t("Bird_Already_In_List"));
    } else {
      birdsToCheck.value.push(normalizeBirdForChecklist(bird));
    }

    if (addListBirdInput.value) {
      addListBirdInput.value.clearInput();
      addListBirdInput.value.focusInput();
    }
  }

  function addAllBirdsFromRegion() {
    if (props.readOnly) {
      return;
    }

    const nextBirds = [...birdsToCheck.value];
    const seenBirdKeys = new Set(nextBirds.map((bird) => getBirdKey(bird)));

    for (const bird of birds.value) {
      const birdKey = getBirdKey(bird);
      if (seenBirdKeys.has(birdKey)) {
        continue;
      }

      nextBirds.push(normalizeBirdForChecklist(bird));
      seenBirdKeys.add(birdKey);
    }

    birdsToCheck.value = nextBirds;
  }

  async function checkBird(bird) {
    if (props.readOnly) {
      addMessage(t("List_Is_Read_Only_For_You"));
      return;
    }

    const birdKey = getBirdKey(bird);
    const obs = props.observations.find((observation) => {
      return getBirdKey(observation) === birdKey && isCurrentUserOwner(observation.owner);
    });

    if (obs) {
      await deleteObservation(obs.id);
      return;
    }

    await addObservation(bird);
  }

  function removeBird(bird) {
    if (props.readOnly) {
      return;
    }
    const birdKey = getBirdKey(bird);
    birdsToCheck.value = birdsToCheck.value.filter((item) => getBirdKey(item) !== birdKey);
  }

  const { users, currentLeader: listCurrentLeader } = useListUserStats(computed(() => props.observations), selectedUser);

  async function saveCheckList() {
    const listId = currentList.value?.id || props.list?.id;
    if (!listId) {
      addMessage(t("List_Save_Failed"));
      return;
    }

    const payload = {
      id: listId,
      birds: toRaw(birdsToCheck.value),
      updated: new Date(),
    };

    try {
      await updateList(payload);
      checkListEditMode.value = false;
    } catch (error) {
      console.error("Failed to save list birds.", error);
      addMessage(t("List_Save_Failed"));
    }
  }

  function initializeBirdsFromList() {
    birdsToCheck.value = Array.isArray(props.list?.birds) ? [...props.list.birds] : [];
  }

  watch(
    () => [locale.value, lang.value],
    ([nextLocale, nextLang]) => {
      loadAllBirds(nextLocale || "en-GB", nextLang || "en");
    },
    { immediate: true }
  );

  watch(
    () => props.list?.birds,
    () => {
      initializeBirdsFromList();
    },
    { immediate: true }
  );

  return {
    t,
    addMessage,
    birds,
    selectedUser,
    checkListEditMode,
    currentLeader: listCurrentLeader,
    birdsToCheck,
    addListBirdInput,
    checkListBirds,
    users,
    addListBird,
    addAllBirdsFromRegion,
    checkBird,
    removeBird,
    saveCheckList,
    initializeBirdsFromList,
  };
}

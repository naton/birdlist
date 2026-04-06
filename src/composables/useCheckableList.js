import { ref, computed, toRaw } from "vue";
import { storeToRefs } from "pinia";
import { groupBy } from "@/helpers";
import { useSettingsStore } from "@/stores/settings.js";
import { useBirdsStore } from "@/stores/birds.js";
import { useListsStore } from "@/stores/lists.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useMessagesStore } from "@/stores/messages.js";

export function useCheckableList(props) {
  const settingsStore = useSettingsStore();
  const { t } = settingsStore;
  const { currentUser, selectedUser } = storeToRefs(settingsStore);

  const birdStore = useBirdsStore();
  const { birds } = storeToRefs(birdStore);

  const listsStore = useListsStore();
  const { updateList } = listsStore;
  const { currentList, checkListEditMode } = storeToRefs(listsStore);

  const observationsStore = useObservationsStore();
  const { addObservation, deleteObservation } = observationsStore;

  const messageStore = useMessagesStore();
  const { addMessage } = messageStore;

  const currentLeader = ref("");
  const birdsToCheck = ref([]);
  const addListBirdInput = ref();

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
    const ownersInCurrentList = new Set(props.observations.map((obs) => obs.owner));
    const selectedOwner = ownersInCurrentList.has(selectedUser.value) ? selectedUser.value : null;

    return birdsToCheck.value.map((bird) => {
      return {
        name: bird,
        checked: props.observations.some((obs) => {
          if (obs.name !== bird) {
            return false;
          }

          if (selectedOwner) {
            return obs.owner === selectedOwner;
          }

          return isCurrentUserOwner(obs.owner);
        }),
      };
    });
  });

  function addListBird(bird) {
    if (props.readOnly) {
      return;
    }

    if (!birdsToCheck.value.includes(bird.name)) {
      birdsToCheck.value.push(bird.name);
    } else {
      addMessage(t("Bird_Already_In_List"));
    }

    if (addListBirdInput.value) {
      addListBirdInput.value.clearInput();
      addListBirdInput.value.focusInput();
    }
  }

  function checkBird(bird) {
    if (props.readOnly) {
      addMessage(t("List_Is_Read_Only_For_You"));
      return;
    }

    const obs = props.observations.find((observation) => {
      return observation.name === bird && isCurrentUserOwner(observation.owner);
    });

    if (obs) {
      deleteObservation(obs.id);
    } else {
      addObservation(bird);
    }
  }

  function removeBird(bird) {
    if (props.readOnly) {
      return;
    }
    birdsToCheck.value = birdsToCheck.value.filter((name) => name !== bird);
  }

  const users = computed(() => {
    const names = [...new Set(props.observations.map((obs) => obs.owner))].sort();
    let highestScore = 0;

    const listUsers = names.map((name) => {
      const score = Object.keys(groupBy(props.observations.filter((obs) => obs.owner === name), "name")).length;
      highestScore = Math.max(score, highestScore);
      return {
        name,
        score,
        leader: false,
      };
    });

    listUsers.forEach((user) => {
      if (user.score === highestScore) {
        user.leader = true;
        currentLeader.value = user.name;
      }
    });

    return listUsers.sort((a, b) => b.score - a.score);
  });

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
    birdsToCheck.value = props.list?.birds || [];
  }

  return {
    t,
    addMessage,
    birds,
    selectedUser,
    checkListEditMode,
    currentLeader,
    birdsToCheck,
    addListBirdInput,
    checkListBirds,
    users,
    addListBird,
    checkBird,
    removeBird,
    saveCheckList,
    initializeBirdsFromList,
  };
}

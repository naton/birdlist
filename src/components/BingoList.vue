<script setup>
import { ref, computed, toRaw, watch, onBeforeMount } from 'vue'
import { storeToRefs } from 'pinia'
import { groupBy } from "@/helpers";
import { useSettingsStore } from '@/stores/settings.js'
import { useBirdsStore } from '@/stores/birds.js'
import { useListsStore } from '@/stores/lists.js'
import { useObservationsStore } from '@/stores/observations.js'
import { useMessagesStore } from '@/stores/messages.js'
import vue3SimpleTypeahead from "vue3-simple-typeahead";
import UserNav from "./UserNav.vue";
import BingoItem from "./BingoItem.vue";
import SvgChart from "./SvgChart.vue";
import 'vue3-simple-typeahead/dist/vue3-simple-typeahead.css'; //Optional default CSS

const emit = defineEmits(["newLeader"]);
const props = defineProps(["list", "comments", "observations"]);

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

const checkListBirds = computed(() => {
  return birdsToCheck.value.map((bird) => {
    return {
      name: bird,
      checked: props.observations.some((obs) => obs.name === bird && obs.owner === (selectedUser.value || currentUser.value.userId)),
    };
  });
});

function addListBird(bird) {
  // only add if not already in the list
  if (!birdsToCheck.value.includes(bird.name)) {
    birdsToCheck.value.push(bird.name);
  } else {
    addMessage(t("Bird_Already_In_List"));
  }
  addListBirdInput.value.clearInput();
  addListBirdInput.value.focusInput();
}

function checkBird(bird) {
  // delete observation if already checked
  const obs = props.observations.find((obs) => obs.name === bird && obs.owner === currentUser.value.userId);
  if (obs) {
    deleteObservation(obs.id);
    return;
  } else {
    addObservation(bird);
  }
}

function removeBird(bird) {
  birdsToCheck.value = birdsToCheck.value.filter((b) => b !== bird);
}

const users = computed(() => {
  const names = [...new Set(props.observations.map((obs) => obs.owner))].sort();
  let users = [];
  let highestScore = 0;
  let leader = false;

  names.forEach((name) => {
    const score = Object.keys(
      groupBy(
        props.observations.filter((obs) => obs.owner === name),
        "name"
      )
    ).length;
    highestScore = score > highestScore ? score : highestScore;
    users.push({
      name,
      score,
      leader,
    });
  });

  users.forEach((user) => {
    if (user.score === highestScore) {
      user.leader = true;
      currentLeader.value = user.name;
    }
  });

  return users.sort((a, b) => b.score - a.score);
});

function emitNewLeader() {
  emit("newLeader");
}

function saveCheckList() {
  const birds = toRaw(birdsToCheck.value);
  const payload = Object.assign({}, currentList.value, { birds });
  updateList(payload);
  checkListEditMode.value = false;
}

/* BINGO stuff */
const bingoSize = ref(props.list?.bingoSize || 3);
const checkListBingoBirds = computed(() => {
  // create an array where the birds are grouped in sub arrays with [bingoSize] birds in each
  const bingoCombinations = 
    checkListBirds.value.slice(0, bingoSize.value * bingoSize.value).reduce((acc, bird, index) => {
    const groupIndex = Math.floor(index / bingoSize.value);
    if (!acc[groupIndex]) {
      acc[groupIndex] = [];
    }
    acc[groupIndex].push(bird);
    return acc;
  }, []);
  
  // add sub arrays with the first bird of each group
  let verticalGroup = [];
  bingoCombinations.forEach((group, index) => {
    const columnBirds = bingoCombinations.map((group) => group[index]);
    verticalGroup.push(columnBirds);
  });
  bingoCombinations.push(...verticalGroup);

  // add sub arrays with the diagonal birds
  let diagonalGroup = [];
  bingoCombinations.forEach((group, index) => {
    if (group[index]) {
      diagonalGroup.push(group[index]);
    }
  });
  bingoCombinations.push(diagonalGroup);

  let reverseDiagonalGroup = [];
  bingoCombinations.forEach((group, index) => {
    if (group[index]) {
      reverseDiagonalGroup.push(group[bingoSize.value - 1 - index]);
    }
  });
  bingoCombinations.push(reverseDiagonalGroup);

  return bingoCombinations;
});

let hasEmittedBingo = false;

watch(checkListBingoBirds, (newGroup) => {
  if ((checkListBingoBirds.value.length + 1 >= bingoSize.value * bingoSize.value) && isBingo(newGroup) && !hasEmittedBingo) {
    addMessage("BINGO!");
    emitNewLeader();
    hasEmittedBingo = true;
  }
});

function isGroupChecked(group) {
  // check if all birds in a sub group are checked
  return group.every((bird) => bird.checked);
}

// check if all birds in any of the sub groups are checked
function isBingo(groups) {
  return groups.some((group) => isGroupChecked(group));
}

onBeforeMount(() => {
  birdsToCheck.value = props.list?.birds || []
  bingoSize.value = props.list?.bingoSize || []
})
</script>

<template>
  <user-nav
    :users="users"
    :selectedUser="selectedUser" />

  <svg-chart v-if="users?.length > 1"
    :observations="props.observations"
    :users="users"
    :selectedUser="selectedUser"
    :currentLeader="currentLeader"
    @newLeader="emitNewLeader"></svg-chart>

  <div v-if="checkListBirds.length" :class="'grid-' + bingoSize">
    <bingo-item v-for="bird in checkListBirds"
    :key="bird.name"
    :bird="bird.name"
    :checked="bird.checked"
    :edit="checkListEditMode"
    @check="checkBird"
    @remove="removeBird"></bingo-item>
  </div>
  <div v-else class="empty-list">
    {{ t("No_Birds_Added") }}
  </div>

  <form v-if="checkListEditMode" class="add-bird">
    <vue3-simple-typeahead ref="addListBirdInput" :placeholder="`${t('Add_Bird_To')} ${t('This_List').toLowerCase()}…`" :items="birds" :minInputLength="1" :itemProjection="(bird) => bird.name" @selectItem="(bird) => addListBird(bird)"></vue3-simple-typeahead>
    <button type="button" @click="saveCheckList" :disabled="checkListBirds.length < bingoSize * bingoSize">
      <span v-if="checkListBirds.length < bingoSize * bingoSize">{{ checkListBirds.length }} / {{ bingoSize * bingoSize }}</span>
      <span v-else>{{ t("Save") }}</span>
    </button>
  </form>
</template>

<style>
form.add-bird {
  position: fixed;
  max-width: 820px;
  margin: auto;
  right: 0;
  bottom: 5rem;
  left: 0;
}

.grid-3,
.grid-4,
.grid-5 {
  --columns: 3;
  display: grid;
  grid-template-columns: repeat(var(--columns), 1fr);
  grid-template-rows: repeat(var(--columns), 1fr);
  margin: 1rem 2px;
  border: 1px solid var(--color-border);
  list-style: none;
  aspect-ratio: 1 / 1;
  width: calc(100% - 4px);
  flex-shrink: 0;
  border-radius: var(--radius);
}

.grid-4 {
  --columns: 4;
}

.grid-5 {
  --columns: 5;
}
</style>
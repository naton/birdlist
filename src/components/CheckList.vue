<script setup>
import { ref, reactive, computed, watch, onBeforeMount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings.js'
import { useBirdsStore } from '@/stores/birds.js'
import { useObservationsStore } from '@/stores/observations.js'
import { useMessagesStore } from '@/stores/messages.js'
import { cssColor, groupBy } from "@/helpers";
import vue3SimpleTypeahead from "vue3-simple-typeahead";
import UserNav from "./UserNav.vue";
import BirdItem from "./BirdItem.vue";
import BingoItem from "./BingoItem.vue";
import 'vue3-simple-typeahead/dist/vue3-simple-typeahead.css'; //Optional default CSS

const props = defineProps(["edit", "list", "comments", "observations"]);
const emit = defineEmits(["save", "newLeader"]);

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { currentUser } = storeToRefs(settingsStore);

const birdStore = useBirdsStore();
const { birds } = storeToRefs(birdStore);

const observationsStore = useObservationsStore();
const { addObservation, deleteObservation } = observationsStore;

const messageStore = useMessagesStore();
const { addMessage } = messageStore;

const selectedUser = ref(currentUser.value?.userId);
const currentLeader = ref("");

const birdsToCheck = ref([]);
const addListBirdInput = ref();

const checkListBirds = computed(() => {
  return birdsToCheck.value.map((bird) => {
    return {
      name: bird,
      checked: props.observations.some((obs) => obs.name === bird && obs.owner === selectedUser.value),
    };
  });
});

const bingoColumns = 3;
const bingoBirds = checkListBirds.value.slice(0, bingoColumns * bingoColumns);
const checkListBingoBirds = computed(() => {
  // create an array where the birds are grouped in sub arrays with [bingoColumns] birds in each
  const bingoCombinations = bingoBirds.reduce((acc, bird, index) => {
    const groupIndex = Math.floor(index / bingoColumns);
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
      reverseDiagonalGroup.push(group[bingoColumns - 1 - index]);
    }
  });
  bingoCombinations.push(reverseDiagonalGroup);

  return bingoCombinations;
});

watch(checkListBingoBirds, (newGroup) => {
  if (checkListBingoBirds.value.length > bingoColumns && isBingo(newGroup)) {
    addMessage("BINGO!");
    emit("newLeader");
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

function saveCheckList() {
  emit("save", birdsToCheck.value);
}

function checkBird(bird) {
  // delete observation if already checked
  if (props.observations.some((obs) => obs.name === bird && obs.owner === currentUser.value.userId)) {
    const obs = props.observations.find((obs) => obs.name === bird && obs.owner === selectedUser.value);
    deleteObservation(obs.id);
    return;
  } else {
    addObservation(bird);
  }
}

function removeBird(bird) {
  birdsToCheck.value = birdsToCheck.value.filter((b) => b !== bird);
}

function changeUser(user) {
  selectedUser.value = user === selectedUser.value ? null : user;
}

const svg = reactive({
  w: 300,
  h: 200,
});

function resize() {
  if (users.value.length > 1) {
    const chart = document.querySelector(".chart-wrapper");
    svg.w = chart.offsetWidth;
  }
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

const observationsByDate = computed(() => {
  return groupBy(props.observations, "date");
});

let options = reactive({
  xMin: 0,
  xMax: window.screen.availWidth,
  yMin: 0,
  yMax: 10,
  line: {
    smoothing: 0.05,
    flattening: 0.05,
  },
});

const datasets = ref([]);

function initGraph() {
  if (!props.observations) {
    return;
  }

  options.yMax = users.value[0].score;
  const firstObsDate = new Date(props.observations[props.observations.length - 1].date);
  const lastObsDate = new Date(props.observations[0].date);
  const datesDiff = parseInt((lastObsDate - firstObsDate) / (1000 * 60 * 60 * 24), 10);
  const graphWidthOfEachDay = Math.ceil(options.xMax / datesDiff);
  const datesWithObservations = Object.keys(observationsByDate.value);
  let graphData = [];

  function createGraphData(owner) {
    let values = [];
    let currentValue = 0;
    let day = new Date(firstObsDate);

    for (let days = 0; days <= datesDiff; days++) {
      const obsDate = day.toISOString().slice(0, 10);
      if (datesWithObservations.includes(obsDate)) {
        currentValue += observationsByDate.value[obsDate].filter((obs) => obs.owner === owner).length;
        values.push([days * graphWidthOfEachDay, currentValue]);
      }
      day.setDate(day.getDate() + 1);
    }

    return values;
  }

  users.value.forEach((user) => {
    graphData.push({
      name: user.name,
      colors: {
        path: cssColor(user.name),
        circles: "var(--color-text-dim)",
      },
      values: createGraphData(user.name),
    });
  });

  datasets.value = graphData;
  resize();
}

watch(currentLeader, (newLeader) => {
  initGraph();
  // Announce new leader only if you’re not alone
  if (users.value.length > 1 && newLeader === currentUser.value?.name) {
    emit("newLeader");
  }
});

onBeforeMount(() => {
  birdsToCheck.value = props.list?.birds || []
})

onMounted(() => {
  window.addEventListener("resize", resize);
});
</script>

<template>
  <user-nav :users="users" :selectedUser="selectedUser" @changeUser="changeUser" />
  <div class="check-list">
    <div v-if="props.list.type === 'bingo'" :class="'grid-' + bingoColumns">
      <bingo-item v-for="bird in bingoBirds"
        :key="bird.name"
        :bird="bird.name"
        :checked="bird.checked"
        :edit="props.edit"
        @check="checkBird"></bingo-item>
    </div>
    <div v-if="checkListBirds">
      <div v-if="props.observations.length" class="center margin-bottom">
        <progress :value="props.observations.length" :max="birdsToCheck.length"></progress>
        <span class="pill">{{ props.observations.length }} / {{ birdsToCheck.length }} {{ t("Species").toLowerCase() }} ({{ Math.round((props.observations.length / birdsToCheck.length) * 100) }}%)</span>
      </div>
      <ul class="list">
        <bird-item v-for="bird in checkListBirds"
          :key="bird"
          :bird="bird.name"
          :checked="bird.checked"
          :edit="props.edit"
          @check="checkBird"
          @remove="removeBird"></bird-item>
      </ul>
    </div>
    <div v-else class="empty-list">
      {{ t("No_Birds_Added") }}
    </div>
    <form v-if="props.edit" class="add-bird">
      <vue3-simple-typeahead ref="addListBirdInput" :placeholder="`${t('Add_Bird_To')} ${t('This_List').toLowerCase()}…`" :items="birds" :minInputLength="1" :itemProjection="(bird) => bird.name" @selectItem="(bird) => addListBird(bird)"></vue3-simple-typeahead>
      <button type="button" @click="saveCheckList">{{ t("Save") }}</button>
    </form>
  </div>
</template>

<style>
progress {
  width: calc(100% - 2rem);
  margin: 0 1rem;
}

.check-list {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

main:has(.check-list) .footer {
  display: none;
}

form.add-bird {
  position: fixed;
  max-width: 820px;
  margin: auto;
  right: 0;
  bottom: 5rem;
  left: 0;
}

.save-form {
  padding: 0.5rem 1rem;
}

.grid-3,
.grid-4,
.grid-5 {
  --columns: 3;
  display: grid;
  grid-template-columns: repeat(var(--columns), 1fr);
  grid-template-rows: repeat(var(--columns), 1fr);
  gap: 0.5rem;
  list-style: none;
}

.grid-4 {
  --columns: 4;
}

.grid-5 {
  --columns: 5;
}
</style>
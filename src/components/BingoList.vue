<script setup>
import { ref, computed, watch, onBeforeMount } from "vue";
import vue3SimpleTypeahead from "vue3-simple-typeahead";
import UserNav from "./UserNav.vue";
import BingoItem from "./BingoItem.vue";
import { useCheckableList } from "@/composables/useCheckableList";
import "vue3-simple-typeahead/dist/vue3-simple-typeahead.css"; // Optional default CSS

const emit = defineEmits(["newLeader"]);
const props = defineProps({
  list: Object,
  comments: Array,
  observations: {
    type: Array,
    default: () => [],
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const {
  t,
  addMessage,
  birds,
  selectedUser,
  checkListEditMode,
  addListBirdInput,
  checkListBirds,
  users,
  addListBird,
  checkBird,
  removeBird,
  saveCheckList,
  initializeBirdsFromList,
} = useCheckableList(props);

function emitNewLeader() {
  emit("newLeader");
}

/* BINGO stuff */
const bingoSize = ref(Number(props.list.bingoSize) || 3);
const checkListBingoBirds = computed(() => {
  const size = Number(bingoSize.value) || 3;
  // create an array where the birds are grouped in sub arrays with [bingoSize] birds in each
  const bingoCombinations = 
    checkListBirds.value.slice(0, size * size).reduce((acc, bird, index) => {
    const groupIndex = Math.floor(index / size);
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
      reverseDiagonalGroup.push(group[size - 1 - index]);
    }
  });
  bingoCombinations.push(reverseDiagonalGroup);

  return bingoCombinations;
});

let previousIsBingo = null;

watch(checkListBingoBirds, (newGroup) => {
  const currentIsBingo = isBingo(newGroup);

  // Initialize without emitting to avoid re-triggering on page load.
  if (previousIsBingo === null) {
    previousIsBingo = currentIsBingo;
    return;
  }

  if (!previousIsBingo && currentIsBingo) {
    addMessage("BINGO!");
    emitNewLeader();
  }

  previousIsBingo = currentIsBingo;
});

function isGroupChecked(group) {
  const size = Number(bingoSize.value) || 3;
  // Only full groups are valid for bingo.
  return Array.isArray(group) && group.length === size && group.every((bird) => bird && bird.checked);
}

// check if all birds in any of the sub groups are checked
function isBingo(groups) {
  const size = Number(bingoSize.value) || 3;
  if (checkListBirds.value.length < size * size) {
    return false;
  }
  return groups.some((group) => isGroupChecked(group));
}

onBeforeMount(() => {
  initializeBirdsFromList();
  bingoSize.value = Number(props.list?.bingoSize) || 3;
});
</script>

<template>
  <user-nav
    :users="users"
    v-model:selectedUser="selectedUser" />

  <section v-if="checkListBirds.length" :class="'grid-' + bingoSize">
    <bingo-item v-for="bird in checkListBirds"
    :key="bird.name"
    :bird="bird.name"
    :checked="bird.checked"
    :edit="checkListEditMode"
    @check="checkBird"
    @remove="removeBird"></bingo-item>
  </section>
  <div v-else class="empty-list">
    {{ t("No_Birds_Added") }}
  </div>
  <p v-if="props.readOnly" class="center margin-bottom">{{ t("List_Is_Read_Only_For_You") }}</p>

  <form v-if="checkListEditMode && !props.readOnly" class="add-bird fixed">
    <vue3-simple-typeahead ref="addListBirdInput" :placeholder="`${t('Add_Bird_To')} ${t('This_List').toLowerCase()}…`" :items="birds" :minInputLength="1" :itemProjection="(bird) => bird.name" @selectItem="(bird) => addListBird(bird)"></vue3-simple-typeahead>
    <button type="button" @click="saveCheckList" :disabled="checkListBirds.length < bingoSize * bingoSize">
      <span v-if="checkListBirds.length < bingoSize * bingoSize">{{ checkListBirds.length }} / {{ bingoSize * bingoSize }}</span>
      <span v-else>{{ t("Save") }}</span>
    </button>
  </form>
</template>

<style>
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

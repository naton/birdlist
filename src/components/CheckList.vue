<script setup>
import { ref, computed, toRaw, onBeforeMount } from 'vue'
import { storeToRefs } from 'pinia'
import { groupBy } from "@/helpers";
import { useSettingsStore } from '@/stores/settings.js'
import { useBirdsStore } from '@/stores/birds.js'
import { useListsStore } from '@/stores/lists.js'
import { useObservationsStore } from '@/stores/observations.js'
import { useMessagesStore } from '@/stores/messages.js'
import vue3SimpleTypeahead from "vue3-simple-typeahead";
import UserNav from "./UserNav.vue";
import BirdItem from "./BirdItem.vue";
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
      checked: props.observations.some((obs) => obs.name === bird && obs.owner === currentUser.value.userId),
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

onBeforeMount(() => {
  birdsToCheck.value = props.list?.birds || []
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

  <div class="check-list">
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
          :edit="checkListEditMode"
          @check="checkBird"
          @remove="removeBird"></bird-item>
      </ul>
    </div>
    <div v-else class="empty-list">
      {{ t("No_Birds_Added") }}
    </div>
  </div>

  <form v-if="checkListEditMode" class="add-bird">
    <vue3-simple-typeahead ref="addListBirdInput" :placeholder="`${t('Add_Bird_To')} ${t('This_List').toLowerCase()}…`" :items="birds" :minInputLength="1" :itemProjection="(bird) => bird.name" @selectItem="(bird) => addListBird(bird)"></vue3-simple-typeahead>
    <button type="button" @click="saveCheckList">{{ t("Save") }}</button>
  </form>
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
</style>
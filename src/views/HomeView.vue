<script setup>
import { onBeforeMount, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { db } from "../db";
import ObservationsLists from "@/components/ObservationsLists.vue";
import EditDialog from "@/components/EditDialog.vue";
import ObservationInput from "@/components/ObservationInput.vue";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useBirdsStore } from "@/stores/birds.js";

const settingsStore = useSettingsStore();
const { lang } = storeToRefs(settingsStore);

const birdStore = useBirdsStore();
const { loadAllBirds } = birdStore;
const { birds } = storeToRefs(birdStore);

const listsStore = useListsStore();
const { currentList } = storeToRefs(listsStore);

const observationsStore = useObservationsStore();
const { currentObservation, editDialog } = storeToRefs(observationsStore);
const { addObservation, deleteObservation } = observationsStore;

/* Lists */
function selectList(list) {
  // Calculated lists come as strings, others are full objects
  if (typeof list === "string") {
    currentList.value = { id: list };
  } else if (list && list.id) {
    currentList.value = list;
    history.replaceState(history.state, "", "#" + list.id);
  }
}

onBeforeMount(() => {
  loadAllBirds(lang.value);
});

onMounted(async () => {
  /* Load list from hash in URL, if available */
  if (!!document.location.hash && document.location.hash.startsWith("#lst")) {
    const listId = document.location.hash.replace("#", "");
    const list = await db.lists.get(listId);
    currentList.value = list ? list : { id: "monthly" };
  }
});
</script>

<template>
  <div class="body">
    <observations-lists @selectList="selectList" />
    <edit-dialog ref="editDialog" v-model="currentObservation" @delete="deleteObservation" />
  </div>
  <div class="footer">
    <observation-input @add="addObservation" />
    <datalist id="birds">
      <option v-for="(bird, index) in birds" :key="index" :value="bird.name">{{ bird.name }}</option>
    </datalist>
  </div>
  <canvas id="canvas"></canvas>
</template>

<style>
.dxc-login-dlg input[type] {
  width: auto !important;
  max-width: 100%;
  margin-bottom: 1rem;
}

#canvas {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 4;
}
</style>

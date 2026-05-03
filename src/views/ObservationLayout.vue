<script setup>
import { ref, computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useListsStore } from "@/stores/lists.js";
import MonthlyList from "@/views/lists/MonthlyList.vue";
import EditObservationDialog from "@/features/observations/components/EditObservationDialog.vue";
import ObservationInput from "@/features/observations/components/ObservationInput.vue";

const route = useRoute();

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { locale } = storeToRefs(settingsStore);

const observationsStore = useObservationsStore();
const { addObservation, deleteObservation } = observationsStore;

const listsStore = useListsStore();
const { canWriteToList } = listsStore;
const { currentList, currentListExpanded } = storeToRefs(listsStore);

const canAddObservation = computed(() => route.name !== "list" || canWriteToList(currentList.value));
const modal = ref();
const currentObservation = ref(null);

function openModal(obs) {
  currentObservation.value = obs;
  modal.value?.showModal();
}
</script>

<template>
  <div class="body">
    <router-view v-slot="{ Component, route }" @edit="openModal">
      <transition name="slide-fade" mode="out-in">
        <div :key="`${route.path}`" class="body-route">
          <component :is="Component || MonthlyList" />
        </div>
      </transition>
    </router-view>
  </div>
  <div class="footer">
    <edit-observation-dialog ref="modal" v-model:observation="currentObservation" v-model:expanded="currentListExpanded" @delete="deleteObservation" />
    <observation-input @add="addObservation" :locale="locale" :disabled="!canAddObservation" :title="!canAddObservation ? t('Join_To_Contribute') : ''" />
  </div>
  <canvas id="canvas"></canvas>
</template>

<style>
.body {
  position: relative;
}

.body-route {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "body-nav"
    "body-content";
  min-height: 100%;
}

.body > .slide-fade-enter-active,
.body > .slide-fade-leave-active {
  inset: 0;
  width: 100%;
}

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

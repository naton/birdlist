<script setup>
import { ref } from "vue";
import { RouterView } from "vue-router";
import { storeToRefs } from "pinia";
import ObservationsLists from "@/components/ObservationsLists.vue";
import EditDialog from "@/components/EditDialog.vue";
import ObservationInput from "@/components/ObservationInput.vue";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";
import { useObservationsStore } from "@/stores/observations.js";

const settingsStore = useSettingsStore();
const { lang } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const { currentList } = storeToRefs(listsStore);

const observationsStore = useObservationsStore();
const { currentObservation } = storeToRefs(observationsStore);
const { addObservation, deleteObservation } = observationsStore;

const modal = ref();

function showModal() {
  modal.value?.show();
}

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
</script>

<template>
  <div class="body">
    <router-view v-slot="{ Component, route }">
        <transition mode="out-in">
            <component :is="Component" :key="`${route.path}`"></component>
        </transition>
        <observations-lists v-if="!Component" @selectList="selectList" @edit="showModal" />
    </router-view>
  </div>
  <div class="footer">
    <edit-dialog ref="modal" v-model="currentObservation" @delete="deleteObservation" />
    <observation-input @add="addObservation" :lang="lang" />
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

.list-header {
  position: relative;
  overflow: hidden;
  padding: 0.25rem 0;
}

.list-description,
.list-owner {
  margin: 0 0.5rem 1rem;
}

.list-owner {
  font-size: 0.9rem;
}

.sidescroll {
  overflow-x: auto;
  padding: 0 0.8rem;
}

.date-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prev-date {
  margin-left: 1rem;
}

.next-date {
  margin-right: 1rem;
}

.year-summary {
  margin: 0 auto 1rem;
  font-size: 0.9rem;
}

.month-button {
  min-width: 2rem;
  padding: 0.5rem;
}

.list {
  position: relative;
  margin: 0.5rem 0 0;
}

.list li {
  display: flex;
  align-items: center;
  overflow: hidden;
  border-top: 1px solid var(--color-background-dim);
  background: var(--color-background);
}

.list a {
  padding: 0.6rem 1em;
  color: inherit;
}

.list .obs {
  display: flex;
  flex: 1;
  align-items: baseline;
  justify-content: space-between;
  padding: 0.6rem 1em;
  transition: 0.1s transform ease-out;
}

.list-header .subtitle {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 1rem;
  background: var(--color-background);
  transition: 0.1s transform ease-out;
}

.list-header button {
  min-height: 2.3rem;
}

.list-header .notify-button {
  margin-top: 0.3rem;
}

.list-header .share-button {
  align-self: center;
  margin-left: 0.5rem;
  white-space: nowrap;
}

.notify-button svg {
  width: 20px;
  vertical-align: middle;
}

.share-button svg {
  width: 16px;
  margin-right: 0.4rem;
  vertical-align: text-top;
}
</style>

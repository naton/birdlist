<script setup>
import { ref } from "vue";
import { RouterView } from "vue-router";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings.js";
import { useObservationsStore } from "@/stores/observations.js";
import MonthlyList from "@/views/lists/MonthlyList.vue";
import EditObservationDialog from "@/components/EditObservationDialog.vue";
import ObservationInput from "@/components/ObservationInput.vue";

const settingsStore = useSettingsStore();
const { lang } = storeToRefs(settingsStore);

const observationsStore = useObservationsStore();
const { addObservation, deleteObservation } = observationsStore;

const modal = ref();

const currentObservation = ref(null);

function openModal(obs) {
  currentObservation.value = obs;
  modal.value?.openModal();
}
</script>

<template>
  <div class="body">
    <router-view v-slot="{ Component, route }" @edit="openModal">
      <template v-if="Component">
        <component :is="Component" :key="`${route.path}`" />
      </template>
      <monthly-list v-else />
    </router-view>
  </div>
  <div class="footer">
    <edit-observation-dialog ref="modal" v-model="currentObservation" @delete="deleteObservation" />
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

.c-tabs {
  display: flex;
  list-style: none;
  overflow-y: hidden;
  overflow-x: auto;
  white-space: nowrap;
  padding: 0;
  overscroll-behavior: none;
}

.c-tabs__tab > a {
  min-width: 5rem;
  display: block;
  border-top: 2px solid transparent;
  padding: 1rem;
  color: inherit;
  font-size: 1.2rem;
  text-transform: capitalize;
  text-decoration: none;
  text-align: center;
}

.c-tabs__tab > .router-link-active {
  margin-top: 2px;
  border-top-color: var(--color-border);
  border-top-left-radius: var(--radius);
  border-top-right-radius: var(--radius);
  background: var(--color-background);
}

.c-tabs__tab svg {
  margin: 0 0.2rem 0.2rem 0;
}

.list-header {
  position: relative;
  overflow: hidden;
  padding: 0.5rem 0 0;
}

.list-description,
.list-owner {
  margin-bottom: 1rem;
  text-indent: 0;
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
  margin: 0 auto 0.5rem;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.month-button {
  min-width: 2rem;
  min-height: 2rem;
  margin: 2px;
  padding: 0;
}

.list li {
  display: flex;
  align-items: center;
  overflow: hidden;
  border-top: 1px solid var(--color-background-dim);
  background: var(--color-background);
}

.list a,
.list b {
  width: 100%;
  padding: 0.6rem 1em;
}

.list a {
  color: inherit;
  text-underline-offset: 0.25em;
}

.list button {
  flex-shrink: 0;
  min-height: 1rem;
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

.list-header details[open] {
  margin-bottom: 1rem;
}

.list-header button {
  min-height: 2.3rem;
}

.list-header .notify-button {
  margin-top: 0.3rem;
}

.notify-button svg {
  width: 20px;
  vertical-align: middle;
}

.share-button svg {
  width: 16px;
  margin-right: 0.25rem;
  vertical-align: text-top;
}
</style>

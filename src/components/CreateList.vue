<script setup>
import { ref } from "vue";
import { inputDate } from "@/helpers";
import { useRouter } from "vue-router";
import AppDialog from "./AppDialog.vue";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from '../stores/lists.js'
import ListsIcon from "./icons/ListsIcon.vue";
import NormalIcon from "@/components/icons/NormalIcon.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import BingoIcon from "@/components/icons/BingoIcon.vue";
import StreakIcon from "@/components/icons/StreakIcon.vue";

const router = useRouter()

const settingsStore = useSettingsStore()
const { t } = settingsStore

const listsStore = useListsStore()
const { createList } = listsStore

// Create a draft object to hold all form data
const listDraft = ref({
  title: "",
  description: "",
  type: "normal",
  startDate: new Date(),
  endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
  reportInterval: 2,
  bingoSize: 3
});

const isDialogOpen = ref(false);

function openModal() {
  // Reset the draft when opening the dialog
  listDraft.value = {
    title: "",
    description: "",
    type: "normal",
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    reportInterval: 2,
    bingoSize: 3
  };
  isDialogOpen.value = true;
}

async function createListAndClose() {
  // Create a payload from the draft object
  let payload = {
    title: listDraft.value.title.trim(),
    updated: new Date(),
    description: listDraft.value.description.trim(),
    type: listDraft.value.type,
  }
  
  // Add type-specific properties
  if (listDraft.value.type === 'bingo') {
    payload.bingoSize = listDraft.value.bingoSize;
  } else if (listDraft.value.type === 'birdstreak') {
    payload.startDate = listDraft.value.startDate;
    payload.endDate = listDraft.value.endDate;
    payload.reportInterval = listDraft.value.reportInterval;
  }

  const listId = await createList(payload);
  router.push({ name: "list", params: { id: listId } });
  close();
}

function close(event) {
  // Prevent any form submission when canceling
  if (event) {
    event.preventDefault();
  }
  isDialogOpen.value = false;
}

defineExpose({
  showModal: openModal,
  close
})
</script>

<template>
  <app-dialog v-model="isDialogOpen" close-on-backdrop>
    <div>
      <div class="grid">
        <lists-icon />
        <h2>{{ t("Create_List") }}</h2>
      </div>
      <label for="title">{{ t("List_Name") }}:</label>
      <input type="text" v-model="listDraft.title" @keyup.esc="close" :placeholder="t('Enter_The_Name_Of_The_List')" required />
      <label for="description">{{ t("Description") }}:</label>
      <textarea id="description" v-model="listDraft.description" cols="30" rows="5" :placeholder="t('List_Rules_Etc')"></textarea>
      <label for="title">{{ t("Type_Of_List") }}:</label>
      <div class="flex">
        <label class="radio">
          <normal-icon />
          <input v-model="listDraft.type" type="radio" value="normal" />{{ t("Normal") }}
        </label>
        <label class="radio">
          <check-icon />
          <input v-model="listDraft.type" type="radio" value="checklist" />{{ t("Checklist") }}
        </label>
        <label class="radio">
          <bingo-icon />
          <input v-model="listDraft.type" type="radio" value="bingo" />{{ t("Bingo") }}
        </label>
        <label class="radio">
          <streak-icon />
          <input v-model="listDraft.type" type="radio" value="birdstreak" />{{ t("Birdstreak") }}
        </label>
      </div>
      <template v-if="listDraft.type === 'bingo'">
        <fieldset class="flex margin-top">
          <legend>{{ t("Size") }}</legend>
          <label class="radio">
            <bingo-icon />
            <input type="radio" value="3" v-model="listDraft.bingoSize" />3 ✕ 3
          </label>
          <label class="radio">
            <bingo-icon />
            <input type="radio" value="4" v-model="listDraft.bingoSize" />4 ✕ 4
          </label>
          <label class="radio">
            <bingo-icon />
            <input type="radio" value="5" v-model="listDraft.bingoSize" />5 ✕ 5
          </label>
        </fieldset>
      </template>
      <div v-if="listDraft.type === 'birdstreak'" class="margin-bottom">
        <div class="flex">
          <div class="half">
            <label for="start-date">{{ t("Start_Date") }}:</label>
            <input type="date" @input="listDraft.startDate = new Date($event.target.value)" :value="inputDate(listDraft.startDate)" required />
          </div>
          <div class="half">
            <label for="end-date">{{ t("End_Date") }}:</label>
            <input type="date" @input="listDraft.endDate = new Date($event.target.value)" :value="inputDate(listDraft.endDate)" required />
          </div>
        </div>
        <label for="day-interval">{{ t("Report_Interval") }}:</label>
        <select v-model.number="listDraft.reportInterval">
          <option value="1">{{ t("Every_Day") }}</option>
          <option value="2">{{ t("Every_Other_Day") }}</option>
          <option value="3">{{ t("Every_Third_Day") }}</option>
          <option value="7">{{ t("Every_Week") }}</option>
        </select>
      </div>
      <details class="help">
        <summary>{{ t("What_Is_This") }}</summary>
        <p v-html="t('Create_List_Help')"></p>
      </details>
      <div class="buttons">
        <button type="button" @click="createListAndClose">{{ t("Create_List") }}</button>
        <button type="button" @click="close" class="secondary">{{ t("Cancel") }}</button>
      </div>
    </div>
  </app-dialog>
</template>

<style>
.flex > .half {
  width: 50%;
}

.flex:has(.radio) {
  justify-content: space-between;
}

label.radio {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
  align-items: center;
  margin-top: 0;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-border);
  font-weight: normal;
}

label.radio input {
  display: none;
}

label.radio:has(:checked) {
  box-shadow: inset 0 0 0 2px var(--color-border);
  color: var(--color-text);
  background: var(--color-background-dim);
}
</style>
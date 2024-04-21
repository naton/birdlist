<script setup>
import { ref, computed, watch } from "vue";
import { inputDate } from "@/helpers";
import { storeToRefs } from "pinia";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from '../stores/lists.js'
import ListsIcon from "./icons/ListsIcon.vue";
import NormalIcon from "@/components/icons/NormalIcon.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import BingoIcon from "@/components/icons/BingoIcon.vue";
import StreakIcon from "@/components/icons/StreakIcon.vue";
import DeleteIcon from "./icons/DeleteIcon.vue";

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { currentUser } = storeToRefs(settingsStore)

const listsStore = useListsStore()
const { updateList, deleteList } = listsStore
const { currentList } = storeToRefs(listsStore)

const listToEdit = ref();
const title = ref('')
const description = ref('')
const type = ref('')
const startDate = ref(new Date())
const endDate = ref(new Date())
const reportInterval = ref(2)
const bingoSize = ref(3)

const isListOwner = computed(() => currentUser.value?.userId === listToEdit.value?.owner);

watch(listToEdit, (list) => {
  if (!list) {
    return
  }
  title.value = list.title,
  description.value = list.description
  type.value = list.type || 'normal'
  
  if (list.type === 'birdstreak') {
    startDate.value = list.startDate
    endDate.value = list.endDate
    reportInterval.value = list.reportInterval
  }
})

const listDialog = ref(null);

function openModal() {
  listToEdit.value = currentList.value;
  listDialog.value.showModal();
}

function saveList() {
  let payload = {
    id: listToEdit.value.id,
    title: title.value.trim(),
    updated: new Date(),
    description: description.value.trim(),
    type: type.value || 'normal',
  }
  if (type.value === 'bingo') {
    payload.bingoSize = bingoSize.value
  } else if (type.value === 'birdstreak') {
    payload.startDate = startDate.value
    payload.endDate = endDate.value
    payload.reportInterval = reportInterval.value
  }
  updateList(payload);
  closeModal();
}

function closeModal() {
  listDialog.value.close();
}

defineExpose({
  openModal,
  closeModal,
})
</script>

<template>
  <dialog ref="listDialog" class="dialog">
    <div class="grid">
      <lists-icon />
      <h2>{{ t("Edit_List") }}</h2>
    </div>
    <label for="list-title">{{ t("List_Name") }}:</label>
    <input type="text" id="list-title" v-model="title" @keyup.esc="closeModal" :placeholder="t('Enter_The_Name_Of_The_List')" autofocus />
    <label for="list-description">{{ t("Description") }}:</label>
    <textarea id="list-description" v-model="description" cols="30" rows="5" :placeholder="t('List_Rules_Etc')"></textarea>
    <label for="title">{{ t("Type_Of_List") }}:</label>
    <div class="flex">
      <label class="radio">
        <normal-icon />
        <input v-model="type" type="radio" value="normal" />{{ t("Normal") }}
      </label>
      <label class="radio">
        <check-icon />
        <input v-model="type" type="radio" value="checklist" />{{ t("Checklist") }}
      </label>
      <label class="radio">
        <bingo-icon />
        <input v-model="type" type="radio" value="bingo" />{{ t("Bingo") }}
      </label>
      <label class="radio">
        <streak-icon />
        <input v-model="type" type="radio" value="birdstreak" />{{ t("Birdstreak") }}
      </label>
    </div>
    <template v-if="type === 'bingo'">
      <fieldset class="flex">
        <legend>{{ t("Size") }}</legend>
        <label class="radio">
          <bingo-icon />
          <input type="radio" value="3" v-model="bingoSize" />3 ✕ 3
        </label>
        <label class="radio">
          <bingo-icon />
          <input type="radio" value="4" v-model="bingoSize" />4 ✕ 4
        </label>
        <label class="radio">
          <bingo-icon />
          <input type="radio" value="5" v-model="bingoSize" />5 ✕ 5
        </label>
      </fieldset>
    </template>
    <template v-if="type === 'birdstreak'">
      <div class="flex">
        <div class="half">
          <label for="start-date">{{ t("Start_Date") }}:</label>
          <input type="date" @input="startDate = new Date($event.target.value)" :value="inputDate(startDate)" />
        </div>
        <div class="half">
          <label for="end-date">{{ t("End_Date") }}:</label>
          <input type="date" @input="endDate = new Date($event.target.value)" :value="inputDate(endDate)" />
        </div>
      </div>
      <label for="day-interval">{{ t("Report_Interval") }}:</label>
      <select v-model.number="reportInterval">
        <option value="1">{{ t("Every_Day") }}</option>
        <option value="2">{{ t("Every_Other_Day") }}</option>
        <option value="3">{{ t("Every_Third_Day") }}</option>
        <option value="7">{{ t("Every_Week") }}</option>
      </select>
    </template>
    <div class="buttons">
      <button v-if="isListOwner" class="update-button" @click="saveList">{{ t("Save") }}</button>
      <button v-if="isListOwner && listToEdit.title" class="delete-button" @click="deleteList(listToEdit.id)">
        <delete-icon />
        {{ t("Delete") }}
      </button>
      <button @click="closeModal" class="secondary">{{ t("Cancel") }}</button>
    </div>
  </dialog>
</template>

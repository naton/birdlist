<script setup>
import { ref, defineExpose } from "vue";
import { inputDate } from "@/helpers";
import { useRouter } from "vue-router";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from '../stores/lists.js'
import ListsIcon from "./icons/ListsIcon.vue";

const router = useRouter()

const settingsStore = useSettingsStore()
const { t } = settingsStore

const listsStore = useListsStore()
const { createList } = listsStore

const title = ref("");
const description = ref("");
const type = ref("normal");
const startDate = ref(new Date())
const endDate = ref(null)
const reportInterval = ref(2)

const listDialog = ref(null);

function openModal() {
  listDialog.value.showModal();
}

async function createListAndClose() {
  const listId = await createList(title.value, description.value, type.value);
  router.push({ name: "list", params: { id: listId } });
  closeModal();
}

function closeModal() {
  listDialog.value.close();
}

defineExpose({
  openModal,
  closeModal
})
</script>

<template>
  <dialog ref="listDialog" class="dialog">
    <div class="grid">
      <lists-icon />
      <h2>{{ t("Create_List") }}</h2>
    </div>
    <label for="title">{{ t("List_Name") }}:</label>
    <input type="text" v-model="title" @keyup.esc="closeModal" :placeholder="t('Enter_The_Name_Of_The_List')" autofocus />
    <label for="description">{{ t("Description") }}:</label>
    <textarea id="description" v-model="description" cols="30" rows="5" :placeholder="t('List_Rules_Etc')"></textarea>
    <label for="title">{{ t("Type_Of_List") }}:</label>
    <div class="grid radio">
      <input type="radio" id="normal" value="normal" v-model="type" />
      <label for="normal">{{ t("Normal") }}</label>
    </div>
    <div class="grid radio">
      <input type="radio" id="birdstreak" value="birdstreak" v-model="type" />
      <label for="birdstreak">{{ t("Birdstreak") }}</label>
    </div>
    <div v-if="type === 'birdstreak'">
      <label for="start-date">{{ t("Start_Date") }}:</label>
      <input type="date" @input="startDate = new Date($event.target.value)" :value="inputDate(startDate)" />
      <label for="end-date">{{ t("End_Date") }}:</label>
      <input type="date" @input="endDate = new Date($event.target.value)" :value="inputDate(endDate)" />
      <label for="day-interval">{{ t("Day_Interval") }}:</label>
      <select v-model.number="reportInterval">
        <option value="1">Varje dag</option>
        <option value="2">Varannan dag</option>
        <option value="3">Var tredje dag</option>
      </select>
    </div>
    <div class="buttons">
      <button class="create" @click="createListAndClose">{{ t("Create_List") }}</button>
      <button @click="closeModal">{{ t("Cancel") }}</button>
    </div>
  </dialog>
</template>

<style>
.radio label {
  margin-top: 0;
}

.buttons {
  display: flex;
  align-items: center;
  margin-top: 1rem;
}

.buttons button {
  display: inline-flex;
  align-items: center;
}
</style>
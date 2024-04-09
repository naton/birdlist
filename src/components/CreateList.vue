<script setup>
import { ref, defineExpose } from "vue";
import { inputDate } from "@/helpers";
import { useRouter } from "vue-router";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from '../stores/lists.js'
import ListsIcon from "./icons/ListsIcon.vue";
import StreakIcon from "@/components/icons/StreakIcon.vue";
import NormalIcon from "@/components/icons/NormalIcon.vue";

const router = useRouter()

const settingsStore = useSettingsStore()
const { t } = settingsStore

const listsStore = useListsStore()
const { createList } = listsStore

const title = ref("");
const description = ref("");
const type = ref("normal");
const startDate = ref(new Date())
const endDate = ref(new Date().setDate(startDate.value.getDate() + 30))
const reportInterval = ref(2)

const listDialog = ref(null);

function openModal() {
  listDialog.value.showModal();
}

async function createListAndClose() {
  const payload = {
    title: title.value.trim(),
    description: description.value.trim(),
    type: type.value === 'birdstreak' ? 'birdstreak' : 'normal',
    startDate: type.value === 'birdstreak' ? startDate.value : null,
    endDate: type.value === 'birdstreak' ? endDate.value : null,
    reportInterval: type.value === 'birdstreak' ? reportInterval.value : null,
  }
  const listId = await createList(payload);
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
    <form @submit.prevent="createListAndClose">
      <div class="grid">
        <lists-icon />
        <h2>{{ t("Create_List") }}</h2>
      </div>
      <label for="title">{{ t("List_Name") }}:</label>
      <input type="text" v-model="title" @keyup.esc="closeModal" :placeholder="t('Enter_The_Name_Of_The_List')" autofocus required />
      <label for="description">{{ t("Description") }}:</label>
      <textarea id="description" v-model="description" cols="30" rows="5" :placeholder="t('List_Rules_Etc')"></textarea>
      <label for="title">{{ t("Type_Of_List") }}:</label>
      <div class="flex">
        <label class="radio half">
          <normal-icon />
          <input v-model="type" type="radio" value="normal" />{{ t("Normal") }}
        </label>
        <label class="radio half">
          <streak-icon />
          <input v-model="type" type="radio" value="birdstreak" />{{ t("Birdstreak") }}
        </label>
      </div>
      <div v-if="type === 'birdstreak'" class="margin-bottom">
        <div class="flex">
          <div class="half">
            <label for="start-date">{{ t("Start_Date") }}:</label>
            <input type="date" @input="startDate = new Date($event.target.value)" :value="inputDate(startDate)" required />
          </div>
          <div class="half">
            <label for="end-date">{{ t("End_Date") }}:</label>
            <input type="date" @input="endDate = new Date($event.target.value)" :value="inputDate(endDate)" required />
          </div>
        </div>
        <label for="day-interval">{{ t("Report_Interval") }}:</label>
        <select v-model.number="reportInterval">
          <option value="1">{{ t("Every_Day") }}</option>
          <option value="2">{{ t("Every_Other_Day") }}</option>
          <option value="3">{{ t("Every_Third_Day") }}</option>
          <option value="7">{{ t("Every_Week") }}</option>
        </select>
      </div>
      <details class="help">
        <summary>{{ t("What_Is_This") }}</summary>
        <p>{{ t("Create_List_Help") }}</p>
      </details>
      <div class="buttons">
        <button type="submit">{{ t("Create_List") }}</button>
        <button @click="closeModal" class="secondary">{{ t("Cancel") }}</button>
      </div>
    </form>
  </dialog>
</template>

<style>
.flex > .half {
  width: 50%;
}

label.radio {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-border);
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
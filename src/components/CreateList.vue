<script setup>
import { ref, defineExpose } from "vue";
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
const listDialog = ref(null);

function openModal() {
  listDialog.value.showModal();
}

async function createListAndClose() {
  const listId = await createList(title.value, description.value);
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
    <textarea id="description" v-model="description" cols="30" rows="10" :placeholder="t('List_Rules_Etc')"></textarea>
    <div class="buttons">
      <button class="create" @click="createListAndClose">{{ t("Create_List") }}</button>
      <button @click="closeModal">{{ t("Cancel") }}</button>
    </div>
  </dialog>
</template>

<style>
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
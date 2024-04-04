<script setup>
import { ref, defineExpose } from "vue";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from '../stores/lists.js'

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
    <input class="margin-bottom" type="text" v-model="title" @keyup.esc="closeModal" :placeholder="t('Enter_The_Name_Of_The_List')" autofocus />
    <textarea class="margin-bottom" id="description" v-model="description" cols="30" rows="10" :placeholder="t('List_Rules_Etc')"></textarea>
    <div class="buttons">
      <button class="create" @click="createList(title, description)">{{ t("Create_List") }}</button>
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
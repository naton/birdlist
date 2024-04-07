<script setup>
import { ref, computed, defineExpose, watch } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from '../stores/lists.js'

const listToEdit = ref();

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { currentUser } = storeToRefs(settingsStore)

const listsStore = useListsStore()
const { updateList, deleteList } = listsStore
const { currentList } = storeToRefs(listsStore)

const title = ref('')
const description = ref('')

// TODO:
watch(listToEdit, (list) => {
  if (!list) {
    return
  }

  title.value = list.title,
  description.value = list.description
})

const listDialog = ref(null);

const isListOwner = computed(() => currentUser.value?.name === listToEdit.value?.owner);

function openModal() {
  listToEdit.value = currentList.value;
  listDialog.value.showModal();
}

function saveList() {
  updateList({
    id: listToEdit.value.id,
    title: title.value.trim(),
    description: description.value.trim(),
  });
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
    <label for="list-title">{{ t("List_Name") }}:</label>
    <input class="margin-top" type="text" id="list-title" v-model="title" @keyup.esc="closeModal" :placeholder="t('Enter_The_Name_Of_The_List')" autofocus />
    <label for="list-description">{{ t("Description") }}:</label>
    <textarea class="margin-bottom" id="list-description" v-model="description" cols="30" rows="10" :placeholder="t('List_Rules_Etc')"></textarea>
    <div class="buttons">
      <button v-if="isListOwner && listToEdit.title" class="update-button" @click="saveList">{{ t("Save") }}</button>
      <button v-if="isListOwner && listToEdit.title" class="delete-button" @click="deleteList(listToEdit.id)">
        <svg xmlns="http://www.w3.org/2000/svg" stroke-width="2" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" stroke-miterlimit="10">
            <path stroke-linecap="square" d="M20 9v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9" />
            <path stroke-linecap="square" d="M1 5h22" />
            <path stroke-linecap="square" d="M12 12v6m-4-6v6m8-6v6" />
            <path d="M8 5V1h8v4" />
          </g>
        </svg>
        {{ t("Delete") }}
      </button>
      <button @click="closeModal">{{ t("Cancel") }}</button>
    </div>
  </dialog>
</template>

<style>
.list-tools {
  margin: 1rem;
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
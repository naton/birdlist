<script setup>
import { ref, computed, defineExpose, watch } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore } from '../stores/settings.js'
import { useListsStore } from '../stores/lists.js'

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { currentUser } = storeToRefs(settingsStore)

const listsStore = useListsStore()
const { updateList, deleteList } = listsStore
const { currentList } = storeToRefs(listsStore)

const title = ref('')
const description = ref('')

// TODO:
watch (currentList, (list) => {
  if (!list) {
    return
  }

  title.value = list.title,
  description.value = list.description
})

const listDialog = ref(null);

const isListOwner = computed(() => currentUser.value?.name === currentList.value?.owner);

function openModal() {
  listDialog.value.showModal();
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
    <input class="margin-bottom" type="text" v-model="title" @keyup.esc="closeModal" :placeholder="t('Enter_The_Name_Of_The_List')" autofocus />
    <textarea class="margin-bottom" id="description" v-model="description" cols="30" rows="10" :placeholder="t('List_Rules_Etc')"></textarea>
    <div class="buttons">
      <button v-if="isListOwner && currentList?.title" class="update-button" @click="updateList(currentList, closeModal)">{{ t("Save") }}</button>
      <button v-if="isListOwner && currentList?.title" class="delete-button" @click="deleteList(currentList.id)">
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
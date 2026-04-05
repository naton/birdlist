<script setup>
import { ref, computed, watch } from "vue";
import AppDialog from "./AppDialog.vue";
import { useSettingsStore } from "../stores/settings.js";
import { useListsStore } from "../stores/lists.js";
import ListsIcon from "./icons/ListsIcon.vue";
import DeleteIcon from "./icons/DeleteIcon.vue";
import ListFormFields from "./ListFormFields.vue";
import { createEditableListDraft, normalizeListDraftForSave } from "@/composables/useListDraft";

const settingsStore = useSettingsStore();
const { t } = settingsStore;

const listsStore = useListsStore();
const { updateList, deleteList, isOwnedByCurrentUser } = listsStore;

const listToEdit = defineModel("list");
const isDialogOpen = defineModel("modelValue", { default: false });

const listDraft = ref(null);
const isListOwner = computed(() => isOwnedByCurrentUser(listToEdit.value));

watch(
  [listToEdit, isDialogOpen],
  ([list, isOpen]) => {
    if (!list || !isOpen) {
      return;
    }

    listDraft.value = createEditableListDraft(list);
  },
  { immediate: true }
);

function openModal() {
  isDialogOpen.value = true;
}

async function saveList() {
  if (!listDraft.value) return;

  const normalizedDraft = normalizeListDraftForSave(listDraft.value);
  Object.assign(listToEdit.value, normalizedDraft);
  await updateList(listToEdit.value);
  close();
}

function close() {
  listDraft.value = null;
  isDialogOpen.value = false;
}

defineExpose({
  showModal: openModal,
  close,
});
</script>

<template>
  <app-dialog v-model="isDialogOpen">
    <div v-if="listDraft" class="grid">
      <lists-icon />
      <h2>{{ t("Edit_List") }}</h2>
    </div>
    <template v-if="listDraft">
      <list-form-fields v-model="listDraft" disable-type-selection @esc="close" />
      <div class="buttons">
        <button v-if="isListOwner" class="update-button" @click="saveList">{{ t("Save") }}</button>
        <button v-if="isListOwner && listToEdit.title" class="delete-button" @click="deleteList(listToEdit.id)">
          <delete-icon />
          {{ t("Delete") }}
        </button>
        <button @click="close" class="secondary">{{ t("Cancel") }}</button>
      </div>
    </template>
    <div v-if="!listDraft" class="loading">
      {{ t("Loading") }}...
    </div>
  </app-dialog>
</template>

<style>
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  font-style: italic;
  color: var(--color-text-dim);
}
</style>

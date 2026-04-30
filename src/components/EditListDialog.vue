<script setup>
import { ref, computed, watch } from "vue";
import AppDialog from "./AppDialog.vue";
import { useSettingsStore } from "../stores/settings.js";
import { useListsStore } from "../stores/lists.js";
import { useMessagesStore } from "../stores/messages.js";
import ListsIcon from "./icons/ListsIcon.vue";
import DeleteIcon from "./icons/DeleteIcon.vue";
import ListFormFields from "./ListFormFields.vue";
import { createEditableListDraft, normalizeListDraftForSave, validateListDraft } from "@/composables/useListDraft";

const settingsStore = useSettingsStore();
const { t } = settingsStore;

const listsStore = useListsStore();
const { updateList, deleteList, isOwnedByCurrentUser, setListPublicVisibility } = listsStore;
const messagesStore = useMessagesStore();
const { addMessage } = messagesStore;

const listToEdit = defineModel("list");
const isDialogOpen = defineModel("modelValue", { default: false });

const listDraft = ref(null);
const isSaving = ref(false);
const isUpdatingVisibility = ref(false);
const isListOwner = computed(() => isOwnedByCurrentUser(listToEdit.value));
const validation = computed(() => validateListDraft(listDraft.value));
const isFormValid = computed(() => validation.value.isValid);
const isPublicList = computed(() => listToEdit.value?.realmId === "rlm-public");
const visibilityButtonLabel = computed(() => (isPublicList.value ? t("Make_List_Private") : t("Make_List_Open")));
const isBusy = computed(() => isSaving.value || isUpdatingVisibility.value);

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
  if (!listDraft.value || isBusy.value || !isFormValid.value) return;

  isSaving.value = true;
  const normalizedDraft = normalizeListDraftForSave(listDraft.value);
  let didSave = false;

  try {
    const payload = { ...listToEdit.value, ...normalizedDraft };
    await updateList(payload);
    Object.assign(listToEdit.value, normalizedDraft);
    didSave = true;
  } catch (error) {
    console.error("Failed to save list.", error);
    addMessage(t("List_Save_Failed"));
  } finally {
    isSaving.value = false;
  }

  if (didSave) {
    close();
  }
}

async function toggleListVisibility() {
  if (isBusy.value || !isListOwner.value || !listToEdit.value?.id) {
    return;
  }

  isUpdatingVisibility.value = true;
  try {
    const makePublic = !isPublicList.value;
    const result = await setListPublicVisibility(listToEdit.value.id, makePublic);

    if (!result?.success || !result?.data?.targetRealmId) {
      addMessage(result?.message || t("List_Visibility_Update_Failed"));
      return;
    }

    listToEdit.value.realmId = result.data.targetRealmId;
    if (listDraft.value) {
      listDraft.value.realmId = result.data.targetRealmId;
    }

    addMessage(makePublic ? t("List_Is_Now_Open") : t("List_Is_Now_Private"));
  } finally {
    isUpdatingVisibility.value = false;
  }
}

function close() {
  if (isBusy.value) {
    return;
  }

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
    <template #header>
      <div v-if="listDraft" class="grid">
        <lists-icon />
        <h2>{{ t("Edit_List") }}</h2>
      </div>
    </template>
    <template #footer>
      <div v-if="listDraft" class="buttons">
        <button v-if="isListOwner" class="secondary" @click="toggleListVisibility" :disabled="isBusy">
          {{ isUpdatingVisibility ? t("Saving") : visibilityButtonLabel }}
        </button>
        <button v-if="isListOwner" class="update-button" @click="saveList" :disabled="isBusy || !isFormValid">
          {{ isSaving ? t("Saving") : t("Save") }}
        </button>
        <button v-if="isListOwner && listToEdit.title" class="delete-button" @click="deleteList(listToEdit.id)" :disabled="isBusy">
          <delete-icon />
          {{ t("Delete") }}
        </button>
        <button @click="close" class="secondary" :disabled="isBusy">{{ t("Cancel") }}</button>
      </div>
    </template>
    <template v-if="listDraft">
      <list-form-fields v-model="listDraft" disable-type-selection :errors="validation.errors" @esc="close" />
      <p class="pill">{{ isPublicList ? t("List_Is_Open") : t("List_Is_Private") }}</p>
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

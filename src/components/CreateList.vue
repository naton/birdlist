<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import AppDialog from "./AppDialog.vue";
import { useSettingsStore } from "../stores/settings.js";
import { useListsStore } from "../stores/lists.js";
import ListsIcon from "./icons/ListsIcon.vue";
import ListFormFields from "./ListFormFields.vue";
import { createDefaultListDraft, buildCreateListPayload, validateListDraft } from "@/composables/useListDraft";

const router = useRouter();

const settingsStore = useSettingsStore();
const { t } = settingsStore;

const listsStore = useListsStore();
const { createList } = listsStore;

const listDraft = ref(createDefaultListDraft());
const isDialogOpen = ref(false);
const isSaving = ref(false);
const validation = computed(() => validateListDraft(listDraft.value));
const isFormValid = computed(() => validation.value.isValid);

function openModal() {
  listDraft.value = createDefaultListDraft();
  isDialogOpen.value = true;
}

async function createListAndClose() {
  if (isSaving.value || !isFormValid.value) {
    return;
  }

  isSaving.value = true;
  const payload = buildCreateListPayload(listDraft.value);
  try {
    const listId = await createList(payload);
    router.push({ name: "list", params: { id: listId } });
    close();
  } finally {
    isSaving.value = false;
  }
}

function close(event) {
  if (isSaving.value) {
    return;
  }

  if (event) {
    event.preventDefault();
  }
  isDialogOpen.value = false;
}

defineExpose({
  showModal: openModal,
  close,
});
</script>

<template>
  <app-dialog v-model="isDialogOpen" close-on-backdrop>
    <div>
      <div class="grid">
        <lists-icon />
        <h2>{{ t("Create_List") }}</h2>
      </div>
      <list-form-fields v-model="listDraft" :require-dates="true" :errors="validation.errors" @esc="close" />
      <details class="help">
        <summary>{{ t("What_Is_This") }}</summary>
        <p v-html="t('Create_List_Help')"></p>
      </details>
      <div class="buttons">
        <button type="button" @click="createListAndClose" :disabled="isSaving || !isFormValid">
          {{ isSaving ? t("Saving") : t("Create_List") }}
        </button>
        <button type="button" @click="close" class="secondary" :disabled="isSaving">{{ t("Cancel") }}</button>
      </div>
    </div>
  </app-dialog>
</template>

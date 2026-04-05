<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AppDialog from "./AppDialog.vue";
import { useSettingsStore } from "../stores/settings.js";
import { useListsStore } from "../stores/lists.js";
import ListsIcon from "./icons/ListsIcon.vue";
import ListFormFields from "./ListFormFields.vue";
import { createDefaultListDraft, buildCreateListPayload } from "@/composables/useListDraft";

const router = useRouter();

const settingsStore = useSettingsStore();
const { t } = settingsStore;

const listsStore = useListsStore();
const { createList } = listsStore;

const listDraft = ref(createDefaultListDraft());
const isDialogOpen = ref(false);

function openModal() {
  listDraft.value = createDefaultListDraft();
  isDialogOpen.value = true;
}

async function createListAndClose() {
  const payload = buildCreateListPayload(listDraft.value);
  const listId = await createList(payload);
  router.push({ name: "list", params: { id: listId } });
  close();
}

function close(event) {
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
      <list-form-fields v-model="listDraft" :require-dates="true" @esc="close" />
      <details class="help">
        <summary>{{ t("What_Is_This") }}</summary>
        <p v-html="t('Create_List_Help')"></p>
      </details>
      <div class="buttons">
        <button type="button" @click="createListAndClose">{{ t("Create_List") }}</button>
        <button type="button" @click="close" class="secondary">{{ t("Cancel") }}</button>
      </div>
    </div>
  </app-dialog>
</template>

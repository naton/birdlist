<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import AppDialog from "@/shared/ui/AppDialog.vue";
import ListsIcon from "@/shared/icons/ListsIcon.vue";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";
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
const anchorTarget = ref(null);
const validation = computed(() => validateListDraft(listDraft.value));
const isFormValid = computed(() => validation.value.isValid);
const isAnchored = computed(() => Boolean(anchorTarget.value));
const ANCHOR_CLASS = "create-list-anchor";

function normalizeAnchorTarget(target) {
  if (!target || typeof target !== "object") {
    return null;
  }
  if (typeof target.classList?.add !== "function") {
    return null;
  }
  return target;
}

function setAnchorTarget(nextTarget) {
  if (anchorTarget.value) {
    anchorTarget.value.classList.remove(ANCHOR_CLASS);
  }
  anchorTarget.value = normalizeAnchorTarget(nextTarget);
  if (anchorTarget.value) {
    anchorTarget.value.classList.add(ANCHOR_CLASS);
  }
}

function openModal(anchorElement) {
  listDraft.value = createDefaultListDraft();
  setAnchorTarget(anchorElement);
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
  setAnchorTarget(null);
  isDialogOpen.value = false;
}

defineExpose({
  showModal: openModal,
  close,
});
</script>

<template>
  <app-dialog
    v-model="isDialogOpen"
    :dialog-class="isAnchored ? 'dialog--create-list-anchored' : ''"
    close-on-backdrop
  >
    <template #header>
      <div class="grid">
        <lists-icon />
        <h2>{{ t("Create_List") }}</h2>
      </div>
    </template>
    <template #footer>
      <div class="buttons">
        <button type="button" @click="createListAndClose" :disabled="isSaving || !isFormValid">
          {{ isSaving ? t("Saving") : t("Create_List") }}
        </button>
        <button type="button" @click="close" class="secondary" :disabled="isSaving">{{ t("Cancel") }}</button>
      </div>
    </template>
    <div>
      <list-form-fields v-model="listDraft" :require-dates="true" :errors="validation.errors" @esc="close" />
      <details class="help">
        <summary>{{ t("What_Is_This") }}</summary>
        <p v-html="t('Create_List_Help')"></p>
      </details>
    </div>
  </app-dialog>
</template>

<style>
.create-list-anchor {
  anchor-name: --create-list-anchor;
}

.dialog--create-list-anchored {
  position: fixed;
  inset: auto;
  margin: 0;
  top: anchor(--create-list-anchor bottom);
  left: anchor(--create-list-anchor right);
  translate: -100% 0.5rem;
  max-inline-size: min(36rem, calc(100vw - 1rem));
  position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
  position-try-options: flip-block, flip-inline, flip-block flip-inline;
}
</style>

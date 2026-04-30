<script setup>
import { ref, computed, onBeforeMount, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import {
  setupConfetti,
  destroyConfetti,
  celebrate,
  subscribeToListNotifications,
  unsubscribeFromListNotifications,
  isListNotificationsEnabled,
  getPublicListParticipants,
} from "@/helpers";
import { db } from "@/db";
import { useSettingsStore } from '@/stores/settings.js'
import { useListsStore } from "@/stores/lists.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useCommentsStore } from "@/stores/comments.js";
import { useMessagesStore } from "@/stores/messages.js";
import ListInfo from "@/components/ListInfo.vue";
import ListActionsMenu from "@/components/ListActionsMenu.vue";
import EditListDialog from "@/components/EditListDialog.vue";
import ListRenderer from "@/features/lists/components/ListRenderer.vue";
import { useListPermissions } from "@/features/lists/composables/useListPermissions.js";

const emit = defineEmits(["openDialog", "edit"]);

const route = useRoute();

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { selectedUser, lang } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const {
  convertToChecklist,
  isPublicList,
  joinPublicList,
  leavePublicList,
  setListPublicVisibility,
  deleteList,
  getListMembers,
} = listsStore;
const { allLists, currentList, checkListEditMode } = storeToRefs(listsStore);

const observationsStore = useObservationsStore();
const { allListObservations } = storeToRefs(observationsStore);

const commentsStore = useCommentsStore()
const { allComments } = storeToRefs(commentsStore)

const messagesStore = useMessagesStore();
const { addMessage } = messagesStore;

const {
  isPremiumUser,
  isListOwner,
  isPublicCurrentList,
  canWriteToCurrentList,
  canJoinCurrentList,
  canLeaveCurrentList,
  mustLoginToJoin,
  showDirectJoinAction,
  canStartEditBirds,
  canMakeChecklist,
} = useListPermissions(currentList);

/* Comments */
const listComments = computed(() => allComments.value?.filter((comment) => comment.listId == route.params.id));

// Dialog state
const editDialog = ref(null);
const isEditDialogOpen = ref(false);
const isUpdatingVisibility = ref(false);

const isSubscribedToNotifications = ref(false);
const isNotificationToggleBusy = ref(false);
const listParticipants = ref([]);
let participantRequestId = 0;

function openModal() {
  if (editDialog.value) {
    editDialog.value.showModal();
  }
  isEditDialogOpen.value = true;
}

function edit(obs) {
  emit("edit", obs)
}

function createChecklistFromCurrentList() {
  convertToChecklist(currentList.value);
}

function toggleEditBirds() {
  checkListEditMode.value = !checkListEditMode.value;
}

async function joinCurrentList() {
  if (!currentList.value?.id) {
    return;
  }
  await joinPublicList(currentList.value.id);
  await refreshListParticipants();
}

async function leaveCurrentList() {
  if (!currentList.value?.id) {
    return;
  }
  await leavePublicList(currentList.value.id);
  await refreshListParticipants();
}

function loginToJoin() {
  db.cloud.login();
}

function handleDirectJoinAction() {
  if (mustLoginToJoin.value) {
    loginToJoin();
    return;
  }

  joinCurrentList();
}

async function copyCurrentListUrl() {
  const listId = currentList.value?.id || route.params.id;
  const url = new URL(`/lists/${encodeURIComponent(listId)}`, window.location.origin).toString();

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const input = document.createElement("textarea");
      input.value = url;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    addMessage(t("List_Link_Copied"));
  } catch (error) {
    console.error("Failed to copy list URL.", error);
    addMessage(t("List_Link_Copy_Failed"));
  }
}

async function toggleCurrentListVisibility() {
  if (isUpdatingVisibility.value || !isListOwner.value || !currentList.value?.id) {
    return;
  }

  isUpdatingVisibility.value = true;
  try {
    const makePublic = !isPublicCurrentList.value;
    const result = await setListPublicVisibility(currentList.value.id, makePublic);

    if (!result?.success || !result?.data?.targetRealmId) {
      addMessage(result?.message || t("List_Visibility_Update_Failed"));
      return;
    }

    addMessage(makePublic ? t("List_Is_Now_Open") : t("List_Is_Now_Private"));
  } finally {
    isUpdatingVisibility.value = false;
  }
}

async function deleteCurrentList() {
  if (!currentList.value?.id) {
    return;
  }

  await deleteList(currentList.value.id);
}

async function refreshNotificationSubscriptionState() {
  if (!currentList.value?.id || !isPremiumUser.value) {
    isSubscribedToNotifications.value = false;
    return;
  }

  isSubscribedToNotifications.value = await isListNotificationsEnabled(currentList.value.id, lang.value);
}

function normalizeParticipants(values) {
  return [...new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

async function refreshListParticipants() {
  const list = currentList.value;
  const requestId = ++participantRequestId;
  if (!list?.id) {
    listParticipants.value = [];
    return;
  }

  if (isPublicList(list)) {
    const result = await getPublicListParticipants(list.id);
    if (requestId !== participantRequestId) {
      return;
    }
    listParticipants.value = normalizeParticipants(result?.success ? result.data?.participants : [list.owner]);
    return;
  }

  const members = await getListMembers(list.id);
  if (requestId !== participantRequestId) {
    return;
  }
  listParticipants.value = normalizeParticipants(members.map((member) => member.email || member.userId));
}

async function toggleListNotificationSubscription() {
  if (!currentList.value?.id || isNotificationToggleBusy.value) {
    return;
  }

  isNotificationToggleBusy.value = true;
  try {
    const didSucceed = isSubscribedToNotifications.value
      ? await unsubscribeFromListNotifications(currentList.value.id)
      : await subscribeToListNotifications(currentList.value.id, lang.value);

    if (didSucceed) {
      await refreshNotificationSubscriptionState();
      return;
    }

    await refreshNotificationSubscriptionState();
  } finally {
    isNotificationToggleBusy.value = false;
  }
}

onBeforeMount(async () => {
  currentList.value = await allLists.value?.find((list) => list.id == route.params.id);
});

onMounted(() => {
  setupConfetti();
});

onBeforeUnmount(() => {
  destroyConfetti();
});

watch(
  () => currentList.value?.id,
  async () => {
    selectedUser.value = null;
    await refreshNotificationSubscriptionState();
    await refreshListParticipants();
  },
  { immediate: true }
);
</script>

<template>
  <edit-list-dialog 
    ref="editDialog" 
    v-model="isEditDialogOpen"
    v-model:list="currentList" 
  />
  <list-info>
    <template v-slot:header>
      <list-actions-menu
        v-if="!showDirectJoinAction && currentList"
        :list="currentList"
        :is-list-owner="isListOwner"
        :is-public-current-list="isPublicCurrentList"
        :can-write-to-current-list="canWriteToCurrentList"
        :can-join-current-list="canJoinCurrentList"
        :can-leave-current-list="canLeaveCurrentList"
        :must-login-to-join="mustLoginToJoin"
        :is-premium-user="isPremiumUser"
        :is-subscribed-to-notifications="isSubscribedToNotifications"
        :is-notification-toggle-busy="isNotificationToggleBusy"
        :can-edit-birds="canStartEditBirds"
        :can-make-checklist="canMakeChecklist"
        :is-updating-visibility="isUpdatingVisibility"
        @toggle-notifications="toggleListNotificationSubscription"
        @join="joinCurrentList"
        @leave="leaveCurrentList"
        @login="loginToJoin"
        @edit-list="openModal"
        @toggle-edit-birds="toggleEditBirds"
        @make-checklist="createChecklistFromCurrentList"
        @toggle-visibility="toggleCurrentListVisibility"
        @delete-list="deleteCurrentList"
        @copy-link="copyCurrentListUrl"
      />
    </template>
    <template v-slot:extra>
      <button
        v-if="showDirectJoinAction"
        type="button"
        class="join-list-button"
        data-action="direct-join"
        @click="handleDirectJoinAction"
      >
        {{ mustLoginToJoin ? t("Login_To_Join") : t("Join_List") }}
      </button>
    </template>
  </list-info>
  <list-renderer
    v-if="currentList"
    :observations="allListObservations"
    :list="currentList"
    :read-only="!canWriteToCurrentList"
    :comments="listComments"
    :participants="listParticipants"
    @newLeader="celebrate"
    @edit="edit"
  />
</template>

<style>
.join-list-button {
  margin-top: 0.75rem;
  width: 100%;
}
</style>

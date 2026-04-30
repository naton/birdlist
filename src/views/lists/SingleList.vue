<script setup>
import { ref, computed, onBeforeMount, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import {
  setupConfetti,
  destroyConfetti,
  celebrate,
  toSafeUserLabel,
} from "@/helpers";
import { db } from "@/db";
import { useSettingsStore } from '@/stores/settings.js';
import { useListsStore } from "@/stores/lists.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useCommentsStore } from "@/stores/comments.js";
import { useMessagesStore } from "@/stores/messages.js";
import { useFriendsStore } from "@/stores/friends.js";
import ListInfo from "@/components/ListInfo.vue";
import ListActionsMenu from "@/components/ListActionsMenu.vue";
import EditListDialog from "@/components/EditListDialog.vue";
import ListRenderer from "@/features/lists/components/ListRenderer.vue";
import { useListActionItems } from "@/features/lists/composables/useListActionItems.js";
import { useListNotifications } from "@/features/lists/composables/useListNotifications.js";
import { useListParticipants } from "@/features/lists/composables/useListParticipants.js";
import { useListPermissions } from "@/features/lists/composables/useListPermissions.js";

const emit = defineEmits(["openDialog", "edit"]);

const route = useRoute();

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { selectedUser } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const {
  convertToChecklist,
  joinPublicList,
  leavePublicList,
  setListPublicVisibility,
  deleteList,
} = listsStore;
const { allLists, currentList, currentListExpanded, checkListEditMode } = storeToRefs(listsStore);

const friendsStore = useFriendsStore();
const { getFriendlyName } = friendsStore;

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

const {
  isSubscribedToNotifications,
  isNotificationToggleBusy,
  refreshNotificationSubscriptionState,
  toggleListNotificationSubscription,
} = useListNotifications(currentList, { isPremiumUser });
const {
  listParticipants,
  refreshListParticipants,
} = useListParticipants(currentList);

/* Comments */
const listComments = computed(() => allComments.value?.filter((comment) => comment.listId == route.params.id));
const listOwnerLabel = computed(() => {
  if (isListOwner.value) {
    return t("By_Me").toLowerCase();
  }

  return toSafeUserLabel(currentList.value?.owner, getFriendlyName(currentList.value?.owner));
});

// Dialog state
const editDialog = ref(null);
const isEditDialogOpen = ref(false);
const isUpdatingVisibility = ref(false);
const { listActionItems, listActionsInfoText } = useListActionItems({
  listRef: currentList,
  t,
  permissions: {
    isListOwner,
    isPublicCurrentList,
    canWriteToCurrentList,
    canJoinCurrentList,
    canLeaveCurrentList,
    mustLoginToJoin,
    canStartEditBirds,
    canMakeChecklist,
  },
  notifications: {
    isSubscribedToNotifications,
    isNotificationToggleBusy,
  },
  isUpdatingVisibility,
});

function openModal() {
  if (editDialog.value) {
    editDialog.value.showModal();
  }
  isEditDialogOpen.value = true;
}

function edit(obs) {
  emit("edit", obs);
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
  <list-info
    :list="currentList"
    :owner-label="listOwnerLabel"
    v-model:expanded="currentListExpanded"
  >
    <template v-slot:header>
      <list-actions-menu
        v-if="!showDirectJoinAction && currentList"
        :list="currentList"
        :actions="listActionItems"
        :info-text="listActionsInfoText"
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

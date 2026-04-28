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
import BirdstreakList from "@/components/BirdstreakList.vue";
import CheckList from "@/components/CheckList.vue";
import BingoList from "@/components/BingoList.vue";
import NormalList from "@/components/NormalList.vue";

const emit = defineEmits(["openDialog", "edit"]);

const route = useRoute();

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { isPremiumUser, isUserLoggedIn, selectedUser } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const {
  convertToChecklist,
  isOwnedByCurrentUser,
  isPublicList,
  isJoinedList,
  canWriteToList,
  joinPublicList,
  leavePublicList,
  setListPublicVisibility,
  deleteList,
} = listsStore;
const { allLists, currentList, checkListEditMode } = storeToRefs(listsStore);

const observationsStore = useObservationsStore();
const { allListObservations } = storeToRefs(observationsStore);

const commentsStore = useCommentsStore()
const { allComments } = storeToRefs(commentsStore)

const messagesStore = useMessagesStore();
const { addMessage } = messagesStore;

/* Comments */
const listComments = computed(() => allComments.value?.filter((comment) => comment.listId == route.params.id));

// Dialog state
const editDialog = ref(null);
const isEditDialogOpen = ref(false);
const isUpdatingVisibility = ref(false);

const isListOwner = computed(() => isOwnedByCurrentUser(currentList.value));
const isPublicCurrentList = computed(() => isPublicList(currentList.value));
const isJoinedCurrentList = computed(() => isJoinedList(currentList.value?.id));
const canWriteToCurrentList = computed(() => canWriteToList(currentList.value));
const canJoinCurrentList = computed(() => isPublicCurrentList.value && !isListOwner.value && !isJoinedCurrentList.value && isUserLoggedIn.value);
const canLeaveCurrentList = computed(() => isPublicCurrentList.value && !isListOwner.value && isJoinedCurrentList.value);
const mustLoginToJoin = computed(() => isPublicCurrentList.value && !isListOwner.value && !isUserLoggedIn.value);
const showDirectJoinAction = computed(() => !canWriteToCurrentList.value && (canJoinCurrentList.value || mustLoginToJoin.value));
const canEditBirds = computed(() => isListOwner.value && (currentList.value?.type === "checklist" || currentList.value?.type === "bingo"));
const canStartEditBirds = computed(() => canEditBirds.value && !checkListEditMode.value);
const canMakeChecklist = computed(() => isListOwner.value && currentList.value?.type === "normal");
const isSubscribedToNotifications = ref(false);
const isNotificationToggleBusy = ref(false);

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
}

async function leaveCurrentList() {
  if (!currentList.value?.id) {
    return;
  }
  await leavePublicList(currentList.value.id);
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

  isSubscribedToNotifications.value = await isListNotificationsEnabled(currentList.value.id);
}

async function toggleListNotificationSubscription() {
  if (!currentList.value?.id || isNotificationToggleBusy.value) {
    return;
  }

  isNotificationToggleBusy.value = true;
  try {
    const didSucceed = isSubscribedToNotifications.value
      ? await unsubscribeFromListNotifications(currentList.value.id)
      : await subscribeToListNotifications(currentList.value.id);

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
      <list-actions-menu
        v-else-if="currentList"
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
      />
    </template>
  </list-info>
  <birdstreak-list v-if="currentList && currentList.type === 'birdstreak'"
    :key="`${currentList.id}-birdstreak`"
    :observations="allListObservations"
    :list="currentList"
    :read-only="!canWriteToCurrentList"
    :comments="listComments"></birdstreak-list>
  <check-list v-else-if="currentList && currentList.type === 'checklist'"
    :key="`${currentList.id}-checklist`"
    :observations="allListObservations"
    :list="currentList"
    :read-only="!canWriteToCurrentList"
    :comments="listComments"></check-list>
  <bingo-list v-else-if="currentList && currentList.type === 'bingo'"
    :key="`${currentList.id}-${currentList.bingoSize}-bingo`"
    :observations="allListObservations"
    :list="currentList"
    :read-only="!canWriteToCurrentList"
    :comments="listComments"
    @newLeader="celebrate"></bingo-list>
  <normal-list v-else-if="currentList"
    :key="`${currentList.id}-normal`"
    :observations="allListObservations"
    :list="currentList"
    :read-only="!canWriteToCurrentList"
    :comments="listComments"
    @newLeader="celebrate"
    @edit="edit">
  </normal-list>
</template>

<style>
.join-list-button {
  margin-top: 0.75rem;
  width: 100%;
}
</style>

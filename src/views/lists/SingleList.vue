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
import { useSettingsStore } from '@/stores/settings.js'
import { useListsStore } from "@/stores/lists.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useCommentsStore } from "@/stores/comments.js";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import ListInfo from "@/components/ListInfo.vue";
import EditListDialog from "@/components/EditListDialog.vue";
import BirdstreakList from "@/components/BirdstreakList.vue";
import CheckList from "@/components/CheckList.vue";
import BingoList from "@/components/BingoList.vue";
import NormalList from "@/components/NormalList.vue";

const emit = defineEmits(["openDialog", "edit"]);

const route = useRoute();

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { isPremiumUser } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const { convertToChecklist, isOwnedByCurrentUser } = listsStore;
const { allLists, currentList, checkListEditMode } = storeToRefs(listsStore);

const observationsStore = useObservationsStore();
const { allListObservations } = storeToRefs(observationsStore);

const commentsStore = useCommentsStore()
const { allComments } = storeToRefs(commentsStore)

/* Comments */
const listComments = computed(() => allComments.value?.filter((comment) => comment.listId == route.params.id));

// Dialog state
const editDialog = ref(null);
const isEditDialogOpen = ref(false);

const isListOwner = computed(() => isOwnedByCurrentUser(currentList.value));
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
        v-if="isPremiumUser && currentList?.id"
        type="button"
        class="secondary"
        :disabled="isNotificationToggleBusy"
        @click="toggleListNotificationSubscription"
      >
        <svg v-if="!isSubscribedToNotifications" xmlns="http://www.w3.org/2000/svg" stroke-width="2" viewBox="0 0 24 24" width="20" height="20">
          <path fill="none" stroke="currentColor" stroke-linecap="square" stroke-miterlimit="10" d="M19 11V8A7 7 0 0 0 5 8v3c0 3.3-3 4.1-3 6 0 1.7 3.9 3 10 3s10-1.3 10-3c0-1.9-3-2.7-3-6Z" />
          <path fill="currentColor" d="M12 22a38.81 38.81 0 0 1-2.855-.1 2.992 2.992 0 0 0 5.71 0c-.894.066-1.844.1-2.855.1Z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M20 10V8A8 8 0 0 0 4 8v2a4.441 4.441 0 0 1-1.547 3.193A4.183 4.183 0 0 0 1 16c0 2.5 4.112 4 11 4s11-1.5 11-4a4.183 4.183 0 0 0-1.453-2.807A4.441 4.441 0 0 1 20 10Z" />
          <path fill="currentColor" d="M9.145 21.9a2.992 2.992 0 0 0 5.71 0c-.894.066-1.844.1-2.855.1s-1.961-.032-2.855-.1Z" />
        </svg>
      </button>
      <button v-if="isListOwner" class="add secondary" @click="openModal">
        {{ t("Edit_List") }}
      </button>
      <button v-if="isListOwner && currentList.type === 'normal'" class="add secondary" @click="createChecklistFromCurrentList">
        <check-icon />
        {{ t("Save_As_Checklist") }}
      </button>
      <button v-if="isListOwner && (currentList.type === 'checklist' || currentList.type === 'bingo')" class="secondary" @click="checkListEditMode = !checkListEditMode">
        {{ !checkListEditMode ? t("Edit_Birds") : t("Cancel") }}
      </button>
    </template>
  </list-info>
  <birdstreak-list v-if="currentList && currentList.type === 'birdstreak'"
    :key="`${currentList.id}-birdstreak`"
    :observations="allListObservations"
    :list="currentList"
    :comments="listComments"></birdstreak-list>
  <check-list v-else-if="currentList && currentList.type === 'checklist'"
    :key="`${currentList.id}-checklist`"
    :observations="allListObservations"
    :list="currentList"
    :comments="listComments"
    @newLeader="celebrate"></check-list>
  <bingo-list v-else-if="currentList && currentList.type === 'bingo'"
    :key="`${currentList.id}-${currentList.bingoSize}-bingo`"
    :observations="allListObservations"
    :list="currentList"
    :comments="listComments"
    @newLeader="celebrate"></bingo-list>
  <normal-list v-else-if="currentList"
    :key="`${currentList.id}-normal`"
    :observations="allListObservations"
    :list="currentList"
    :comments="listComments"
    @newLeader="celebrate"
    @edit="edit">
  </normal-list>
</template>

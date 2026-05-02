<script setup>
import { computed, ref, watch } from "vue";
import AppDialog from "@/shared/ui/AppDialog.vue";
import DeleteIcon from "@/shared/icons/DeleteIcon.vue";
import UserIcon from "@/shared/icons/UserIcon.vue";
import { toSafeUserLabel } from "@/helpers";
import { useFriendsStore } from "@/stores/friends.js";
import { useListsStore } from "@/stores/lists.js";
import { useSettingsStore } from "@/stores/settings.js";

const props = defineProps({
  list: {
    type: Object,
    default: null,
  },
  participants: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["left"]);

const isDialogOpen = defineModel("modelValue", { default: false });

const settingsStore = useSettingsStore();
const { t } = settingsStore;

const friendsStore = useFriendsStore();
const { getFriendlyName } = friendsStore;

const listsStore = useListsStore();
const { deleteList, isOwnedByCurrentUser, isPublicList, leaveList } = listsStore;

const selectedNewOwner = ref("");
const isBusy = ref(false);
const isOwner = computed(() => isOwnedByCurrentUser(props.list));
const isOpenList = computed(() => isPublicList(props.list));
const otherParticipants = computed(() => {
  const owner = String(props.list?.owner || "");
  return [...new Set(props.participants.map((participant) => String(participant || "").trim()).filter(Boolean))]
    .filter((participant) => participant !== owner);
});
const hasOtherParticipants = computed(() => otherParticipants.value.length > 0);
const canTransferOwnership = computed(() => isOwner.value && hasOtherParticipants.value);
const shouldDeletePrivateList = computed(() => isOwner.value && !isOpenList.value && !hasOtherParticipants.value);
const shouldOfferPublicDelete = computed(() => isOwner.value && isOpenList.value && !hasOtherParticipants.value);
const canLeave = computed(() => !isOwner.value || canTransferOwnership.value);

watch([isDialogOpen, otherParticipants], ([isOpen, participants]) => {
  if (!isOpen) {
    return;
  }

  if (!participants.includes(selectedNewOwner.value)) {
    selectedNewOwner.value = participants[0] || "";
  }
}, { immediate: true });

function participantLabel(participant) {
  return toSafeUserLabel(participant, getFriendlyName(participant));
}

function openModal() {
  isDialogOpen.value = true;
}

function close() {
  if (!isBusy.value) {
    isDialogOpen.value = false;
  }
}

async function confirmLeave() {
  if (!props.list?.id || !canLeave.value || isBusy.value) {
    return;
  }

  isBusy.value = true;
  try {
    const result = await leaveList(props.list.id, {
      newOwner: isOwner.value ? selectedNewOwner.value : "",
    });
    if (result?.success) {
      emit("left");
      close();
    }
  } finally {
    isBusy.value = false;
  }
}

async function deleteInstead() {
  if (!props.list?.id || isBusy.value) {
    return;
  }

  isBusy.value = true;
  try {
    await deleteList(props.list.id, {
      confirm: false,
      deleteRelatedObservations: false,
    });
    emit("left");
    close();
  } finally {
    isBusy.value = false;
  }
}

defineExpose({
  showModal: openModal,
  close,
});
</script>

<template>
  <app-dialog v-model="isDialogOpen">
    <template #header>
      <div class="grid">
        <user-icon />
        <h2>{{ t("Leave_List") }}</h2>
      </div>
    </template>

    <template v-if="props.list">
      <p v-if="!isOwner">
        {{ t("Leave_List_Member_Info") }}
      </p>
      <div v-else-if="canTransferOwnership">
        <p>{{ t("Leave_List_Owner_Info") }}</p>
        <label for="new-owner">{{ t("New_List_Owner") }}</label>
        <select id="new-owner" v-model="selectedNewOwner">
          <option v-for="participant in otherParticipants" :key="participant" :value="participant">
            {{ participantLabel(participant) }}
          </option>
        </select>
      </div>
      <p v-else-if="shouldDeletePrivateList">
        {{ t("Leave_List_Delete_Private_Info") }}
      </p>
      <p v-else-if="shouldOfferPublicDelete">
        {{ t("Leave_List_Public_Alone_Info") }}
      </p>
      <p class="margin-top">
        {{ t("Leave_List_Comments_Info") }}
      </p>
    </template>

    <template #footer>
      <div class="buttons">
        <button v-if="canLeave" type="button" :disabled="isBusy || (isOwner && !selectedNewOwner)" @click="confirmLeave">
          {{ isBusy ? t("Saving") : t("Leave_List") }}
        </button>
        <button
          v-if="shouldDeletePrivateList || shouldOfferPublicDelete"
          type="button"
          class="delete-button"
          :disabled="isBusy"
          @click="deleteInstead"
        >
          <delete-icon />
          {{ isBusy ? t("Saving") : t("Delete") }}
        </button>
        <button type="button" class="secondary" :disabled="isBusy" @click="close">
          {{ t("Cancel") }}
        </button>
      </div>
    </template>
  </app-dialog>
</template>

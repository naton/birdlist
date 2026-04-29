<script setup>
import { computed, ref } from "vue";
import { useSettingsStore } from "@/stores/settings.js";
import ShareDialog from "./ShareDialog.vue";
import FriendsIcon from "@/components/icons/FriendsIcon.vue";
import EditIcon from "@/components/icons/EditIcon.vue";
import BirdsIcon from "@/components/icons/BirdsIcon.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import ViewIcon from "@/components/icons/ViewIcon.vue";
import DeleteIcon from "@/components/icons/DeleteIcon.vue";
import UserIcon from "@/components/icons/UserIcon.vue";
import SettingsIcon from "@/components/icons/SettingsIcon.vue";

const props = defineProps({
  list: {
    type: Object,
    default: null,
  },
  isListOwner: {
    type: Boolean,
    default: false,
  },
  isPublicCurrentList: {
    type: Boolean,
    default: false,
  },
  canWriteToCurrentList: {
    type: Boolean,
    default: false,
  },
  canJoinCurrentList: {
    type: Boolean,
    default: false,
  },
  canLeaveCurrentList: {
    type: Boolean,
    default: false,
  },
  mustLoginToJoin: {
    type: Boolean,
    default: false,
  },
  isPremiumUser: {
    type: Boolean,
    default: false,
  },
  isSubscribedToNotifications: {
    type: Boolean,
    default: false,
  },
  isNotificationToggleBusy: {
    type: Boolean,
    default: false,
  },
  canEditBirds: {
    type: Boolean,
    default: false,
  },
  // Compatibility alias for previous SingleList binding.
  isEditingBirds: {
    type: Boolean,
    default: false,
  },
  canMakeChecklist: {
    type: Boolean,
    default: false,
  },
  isUpdatingVisibility: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "toggle-notifications",
  "join",
  "leave",
  "login",
  "edit-list",
  "toggle-edit-birds",
  "make-checklist",
  "toggle-visibility",
  "delete-list",
]);

const settingsStore = useSettingsStore();
const { t } = settingsStore;

const shareListDialog = ref(null);

const popoverId = computed(() => {
  const normalizedId = String(props.list?.id || "current").replace(/[^a-zA-Z0-9_-]/g, "-");
  return `list-actions-${normalizedId}`;
});

const canShare = computed(() => props.isListOwner);
const canSubscribe = computed(() => props.isPremiumUser && Boolean(props.list?.id));
const canToggleVisibility = computed(() => props.isListOwner && Boolean(props.list?.id));
const canDeleteList = computed(() => props.isListOwner && Boolean(props.list?.id));
const showReadOnlyInfo = computed(() => props.isPublicCurrentList && !props.canWriteToCurrentList);
const subscriptionLabel = computed(() => (props.isSubscribedToNotifications ? "Unsubscribe" : "Subscribe"));
const visibilityLabel = computed(() => (props.isPublicCurrentList ? t("Make_List_Private") : t("Make_List_Open")));
const hasAnyAction = computed(() => {
  return (
    canShare.value ||
    canSubscribe.value ||
    props.canJoinCurrentList ||
    props.canLeaveCurrentList ||
    props.mustLoginToJoin ||
    props.isListOwner ||
    props.canEditBirds ||
    props.canMakeChecklist
  );
});

function closePopover() {
  const popover = document.getElementById(popoverId.value);
  if (typeof popover?.hidePopover === "function") {
    popover.hidePopover();
  }
}

function runAction(eventName) {
  closePopover();
  emit(eventName);
}

function openShareModal() {
  closePopover();
  const dialog = shareListDialog.value;
  if (typeof dialog?.showModal === "function") {
    dialog.showModal();
    return;
  }
  if (typeof dialog?.openModal === "function") {
    dialog.openModal();
  }
}
</script>

<template>
  <share-dialog ref="shareListDialog" />

  <button
    v-if="hasAnyAction"
    type="button"
    class="secondary list-menu-button list-actions-anchor"
    :popovertarget="popoverId"
    data-action="open-menu"
  >
    <settings-icon class="option-icon" />
  </button>

  <section :id="popoverId" popover="auto" class="list-actions-popover">
    <h3 class="list-actions-heading center">{{ t("Settings") }}</h3>

    <p v-if="showReadOnlyInfo" class="list-actions-help">
      {{ props.mustLoginToJoin ? t("Open_List_Login_Required") : t("Join_To_Contribute") }}
    </p>

    <button v-if="canShare" type="button" class="list-action" data-action="share" @click="openShareModal">
      <friends-icon class="option-icon" />
      <span>{{ t("Share") }}</span>
    </button>

    <button
      v-if="canSubscribe"
      type="button"
      class="list-action"
      data-action="subscribe"
      :disabled="props.isNotificationToggleBusy"
      @click="runAction('toggle-notifications')"
    >
      <svg
        class="option-icon"
        v-if="!props.isSubscribedToNotifications"
        xmlns="http://www.w3.org/2000/svg"
        stroke-width="2"
        viewBox="0 0 24 24"
        width="20"
        height="20"
      >
        <path fill="none" stroke="currentColor" stroke-linecap="square" stroke-miterlimit="10" d="M19 11V8A7 7 0 0 0 5 8v3c0 3.3-3 4.1-3 6 0 1.7 3.9 3 10 3s10-1.3 10-3c0-1.9-3-2.7-3-6Z" />
        <path fill="currentColor" d="M12 22a38.81 38.81 0 0 1-2.855-.1 2.992 2.992 0 0 0 5.71 0c-.894.066-1.844.1-2.855.1Z" />
      </svg>
      <svg
        class="option-icon"
        v-else
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="20"
        height="20"
      >
        <path fill="currentColor" d="M20 10V8A8 8 0 0 0 4 8v2a4.441 4.441 0 0 1-1.547 3.193A4.183 4.183 0 0 0 1 16c0 2.5 4.112 4 11 4s11-1.5 11-4a4.183 4.183 0 0 0-1.453-2.807A4.441 4.441 0 0 1 20 10Z" />
        <path fill="currentColor" d="M9.145 21.9a2.992 2.992 0 0 0 5.71 0c-.894.066-1.844.1-2.855.1s-1.961-.032-2.855-.1Z" />
      </svg>
      <span>{{ subscriptionLabel }}</span>
    </button>

    <button v-if="props.canJoinCurrentList" type="button" class="list-action" data-action="join" @click="runAction('join')">
      <user-icon class="option-icon" />
      <span>{{ t("Join_List") }}</span>
    </button>

    <button v-if="props.canLeaveCurrentList" type="button" class="list-action" data-action="leave" @click="runAction('leave')">
      <user-icon class="option-icon" />
      <span>{{ t("Leave_List") }}</span>
    </button>

    <button v-if="props.mustLoginToJoin" type="button" class="list-action" data-action="login" @click="runAction('login')">
      <user-icon class="option-icon" />
      <span>{{ t("Login_To_Join") }}</span>
    </button>

    <button v-if="props.isListOwner" type="button" class="list-action" data-action="edit-list" @click="runAction('edit-list')">
      <edit-icon class="option-icon" />
      <span>{{ t("Edit_List") }}</span>
    </button>

    <button
      v-if="props.canEditBirds"
      type="button"
      class="list-action"
      data-action="toggle-edit-birds"
      @click="runAction('toggle-edit-birds')"
    >
      <birds-icon class="option-icon" />
      <span>{{ t("Edit_Birds") }}</span>
    </button>

    <button
      v-if="props.canMakeChecklist"
      type="button"
      class="list-action"
      data-action="make-checklist"
      @click="runAction('make-checklist')"
    >
      <check-icon class="option-icon" />
      <span>{{ t("Save_As_Checklist") }}</span>
    </button>

    <button
      v-if="canToggleVisibility"
      type="button"
      class="list-action"
      data-action="toggle-visibility"
      :disabled="props.isUpdatingVisibility"
      @click="runAction('toggle-visibility')"
    >
      <view-icon class="option-icon" />
      <span>{{ visibilityLabel }}</span>
    </button>

    <button
      v-if="canDeleteList"
      type="button"
      class="list-action danger"
      data-action="delete"
      @click="runAction('delete-list')"
    >
      <delete-icon class="option-icon" />
      <span>{{ t("Delete") }}</span>
    </button>
  </section>
</template>

<style>
.list-actions-popover {
  position: fixed;
  position-anchor: --list-actions-anchor;
  inset: auto;
  margin: 0;
  top: anchor(bottom);
  left: anchor(left);
  width: min(22rem, calc(100% - 2rem));
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 0.75rem;
  box-shadow: 0 10px 20px rgb(0 0 0 / 20%);
  background: var(--color-background-dim);
  position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
  position-try-options: flip-block, flip-inline, flip-block flip-inline;
}

.list-actions-popover::backdrop {
  background: #00000066;
}

.list-actions-heading {
  margin-bottom: 0.5rem;
}

.list-actions-help {
  margin-bottom: 0.75rem;
}

.list-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  margin-bottom: 0.5rem;
  text-align: left;
}

.list-action:last-child {
  margin-bottom: 0;
}

.list-action.danger {
  border-color: var(--color-error);
}

.option-icon {
  width: 1.2rem;
  height: 1.2rem;
  flex-shrink: 0;
}

.list-actions-anchor {
  anchor-name: --list-actions-anchor;
}
</style>

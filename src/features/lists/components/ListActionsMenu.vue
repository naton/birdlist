<script setup>
import { computed, ref } from "vue";
import { useSettingsStore } from "@/stores/settings.js";
import ShareDialog from "@/features/lists/components/ShareDialog.vue";
import FriendsIcon from "@/shared/icons/FriendsIcon.vue";
import EditIcon from "@/shared/icons/EditIcon.vue";
import BirdsIcon from "@/shared/icons/BirdsIcon.vue";
import CheckIcon from "@/shared/icons/CheckIcon.vue";
import ViewIcon from "@/shared/icons/ViewIcon.vue";
import DeleteIcon from "@/shared/icons/DeleteIcon.vue";
import UserIcon from "@/shared/icons/UserIcon.vue";
import SettingsIcon from "@/shared/icons/SettingsIcon.vue";

const props = defineProps({
  list: {
    type: Object,
    default: null,
  },
  actions: {
    type: Array,
    default: () => [],
  },
  infoText: {
    type: String,
    default: "",
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
  "copy-link",
  "action",
]);

const settingsStore = useSettingsStore();
const { t } = settingsStore;

const shareListDialog = ref(null);

const popoverId = computed(() => {
  const normalizedId = String(props.list?.id || "current").replace(/[^a-zA-Z0-9_-]/g, "-");
  return `list-actions-${normalizedId}`;
});

const visibleActions = computed(() => props.actions.filter((action) => action && action.visible !== false));
const hasAnyAction = computed(() => visibleActions.value.length > 0);
const iconComponents = {
  friends: FriendsIcon,
  edit: EditIcon,
  birds: BirdsIcon,
  check: CheckIcon,
  view: ViewIcon,
  delete: DeleteIcon,
  user: UserIcon,
};

function closePopover() {
  const popover = document.getElementById(popoverId.value);
  if (typeof popover?.hidePopover === "function") {
    popover.hidePopover();
  }
}

function runAction(eventName) {
  closePopover();
  emit(eventName);
  emit("action", eventName);
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

function triggerAction(action) {
  if (action.disabled) {
    return;
  }

  if (action.key === "share") {
    openShareModal();
    return;
  }

  runAction(action.event || action.key);
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

    <p v-if="props.infoText" class="list-actions-help">
      {{ props.infoText }}
    </p>

    <button
      v-for="action in visibleActions"
      :key="action.key"
      type="button"
      class="list-action"
      :class="{ danger: action.danger }"
      :data-action="action.dataAction || action.key"
      :disabled="action.disabled"
      @click="triggerAction(action)"
    >
      <svg
        class="option-icon"
        v-if="action.icon === 'bell'"
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
        v-else-if="action.icon === 'bell-filled'"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="20"
        height="20"
      >
        <path fill="currentColor" d="M20 10V8A8 8 0 0 0 4 8v2a4.441 4.441 0 0 1-1.547 3.193A4.183 4.183 0 0 0 1 16c0 2.5 4.112 4 11 4s11-1.5 11-4a4.183 4.183 0 0 0-1.453-2.807A4.441 4.441 0 0 1 20 10Z" />
        <path fill="currentColor" d="M9.145 21.9a2.992 2.992 0 0 0 5.71 0c-.894.066-1.844.1-2.855.1s-1.961-.032-2.855-.1Z" />
      </svg>
      <component v-else :is="iconComponents[action.icon] || FriendsIcon" class="option-icon" />
      <span>{{ action.label }}</span>
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

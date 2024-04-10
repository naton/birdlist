<script setup>
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";
import { askNotificationPermission, removePushManager } from "../helpers";
import ShareDialog from "./ShareDialog.vue";

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { currentUser } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const { currentList, currentListExpanded } = storeToRefs(listsStore);

const shareListDialog = ref();

const isSubscribed = ref(false);
const isListOwner = computed(() => currentUser.value?.name === currentList.value?.owner);

function toggleNotificationIcon() {
  isSubscribed.value = !isSubscribed.value;
}

function toggleSubscription() {
  if (isSubscribed.value) {
    return removePushManager(toggleNotificationIcon);
  } else {
    return askNotificationPermission(toggleNotificationIcon);
  }
}

function openShareModal() {
    shareListDialog.value.openModal();
}
</script>

<template>
    <share-dialog ref="shareListDialog" />
    <div class="list-header">
        <div class="subtitle">
            <details :open="currentListExpanded">
                <summary class="heading" @click.prevent="currentListExpanded = !currentListExpanded">{{ currentList?.title }}</summary>
                <p class="list-description">{{ currentList?.description }}</p>
                <p class="list-owner">{{ t("Created_By") }} {{ currentList?.owner }}</p>
                <div>
                    <button type="button" class="notify-button" @click.prevent="toggleSubscription">
                        <svg v-if="!isSubscribed" xmlns="http://www.w3.org/2000/svg" stroke-width="2" viewBox="0 0 24 24">
                            <path fill="none" stroke="currentColor" stroke-linecap="square" stroke-miterlimit="10" d="M19 11V8A7 7 0 0 0 5 8v3c0 3.3-3 4.1-3 6 0 1.7 3.9 3 10 3s10-1.3 10-3c0-1.9-3-2.7-3-6Z" />
                            <path fill="currentColor" d="M12 22a38.81 38.81 0 0 1-2.855-.1 2.992 2.992 0 0 0 5.71 0c-.894.066-1.844.1-2.855.1Z" />
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M20 10V8A8 8 0 0 0 4 8v2a4.441 4.441 0 0 1-1.547 3.193A4.183 4.183 0 0 0 1 16c0 2.5 4.112 4 11 4s11-1.5 11-4a4.183 4.183 0 0 0-1.453-2.807A4.441 4.441 0 0 1 20 10Z" />
                            <path fill="currentColor" d="M9.145 21.9a2.992 2.992 0 0 0 5.71 0c-.894.066-1.844.1-2.855.1s-1.961-.032-2.855-.1Z" />
                        </svg>
                    </button>
                    <button class="share-button" :disabled="!isListOwner" @click="openShareModal">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                            <g fill="var(--color-background-dim)">
                                <path d="M4.5 5H7v5a1 1 0 0 0 2 0V5h2.5a.5.5 0 0 0 .376-.829l-3.5-4a.514.514 0 0 0-.752 0l-3.5 4A.5.5 0 0 0 4.5 5Z" />
                                <path d="M14 7h-3v2h3v5H2V9h3V7H2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                            </g>
                        </svg>
                        {{ t("Share") }}
                    </button>
                    <span v-if="!isListOwner" class="share-info">
                        {{ t("Contact_The_List_Creator") }}
                    </span>
                    <slot name="extra" />
                </div>
            </details>
        </div>
    </div>
</template>

<style>
.share-info {
    margin-left: 0.5rem;
}
</style>
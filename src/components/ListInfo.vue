<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";
import { useFriendsStore } from "@/stores/friends.js";
import { toSafeUserLabel } from "@/helpers";

const settingsStore = useSettingsStore();
const { t } = settingsStore;

const listsStore = useListsStore();
const { isOwnedByCurrentUser } = listsStore;
const { currentList, currentListExpanded } = storeToRefs(listsStore);

const friendsStore = useFriendsStore();
const { getFriendlyName } = friendsStore;

const isListOwner = computed(() => isOwnedByCurrentUser(currentList.value));

function getListOwnerAsFriendName() {
    return isListOwner.value
      ? t("By_Me").toLowerCase()
      : toSafeUserLabel(currentList.value?.owner, getFriendlyName(currentList.value?.owner));
}
</script>

<template>
    <div class="list-header">
        <div class="subtitle">
            <router-link to="/lists">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24" fill="var(--color-text)">
                    <title>left-arrow</title>
                    <path d="M22.3 31.7a1 1 0 0 0 1.4 0l1-1a1 1 0 0 0 0-1.4L11.4 16 24.7 2.7a1 1 0 0 0 0-1.4l-1-1a1 1 0 0 0-1.4 0l-15 15a1 1 0 0 0 0 1.4Z"/>
                </svg>
            </router-link>
            <h1 class="heading">{{ currentList?.title }}</h1>
            <slot name="header" />
        </div>
        <details :open="currentListExpanded" @click.prevent="currentListExpanded = !currentListExpanded">
            <p class="list-description">{{ currentList?.description }}</p>
            <p class="list-owner">{{ t("Created_By") }} {{ getListOwnerAsFriendName() }}</p>
        </details>
        <slot name="extra" />
    </div>
</template>

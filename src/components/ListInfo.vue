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
            <details :open="currentListExpanded">
                <summary class="heading center" @click.prevent="currentListExpanded = !currentListExpanded">{{ currentList?.title }}</summary>
                <p class="list-description">{{ currentList?.description }}</p>
                <p class="list-owner">{{ t("Created_By") }} {{ getListOwnerAsFriendName() }}</p>
                <div>
                    <slot name="extra" />
                </div>
            </details>
        </div>
    </div>
</template>

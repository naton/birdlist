<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { currentUser } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const { shareBirdList } = listsStore;
const { currentList } = storeToRefs(listsStore);

const isListOwner = computed(() => currentUser.value?.name === currentList.value?.owner);
</script>

<template>
    <div class="list-header">
        <div class="subtitle">
            <details>
                <summary class="heading">{{ currentList?.title }}</summary>
                <p class="list-description">{{ currentList?.description }}</p>
                <p class="list-owner">{{ t("Created_By") }} {{ currentList?.owner }}</p>
                <div>
                    <button class="share-button" :disabled="!isListOwner" @click.stop="shareBirdList(currentList?.id, currentList?.title)">
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
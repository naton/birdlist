<script setup>
import { useSettingsStore } from "@/stores/settings.js";

const props = defineProps({
  list: {
    type: Object,
    default: null,
  },
  ownerLabel: {
    type: String,
    default: "",
  },
});

const settingsStore = useSettingsStore();
const { t } = settingsStore;
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
            <h1 class="heading">{{ props.list?.title }}</h1>
            <slot name="header" />
        </div>
        <details>
            <summary>{{ t("Details") }}</summary>
            <p class="list-description">{{ props.list?.description }}</p>
            <p class="list-owner">{{ t("Created_By") }} {{ props.ownerLabel }}</p>
        </details>
        <slot name="extra" />
    </div>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings.js';

const settingsStore = useSettingsStore();
const { t } = settingsStore;
</script>

<template>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" :title="t('Location_Found')">
        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 15.5s-5.5-5-5.5-9.5a5.5 5.5 0 0 1 11 0 6.883 6.883 0 0 1-.322 2" />
            <circle cx="8" cy="6" r="1.5" />
            <path d="m8.5 11.5 2 2 4-4" />
        </g>
    </svg>
</template>
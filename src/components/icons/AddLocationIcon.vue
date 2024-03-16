<script setup>
import { useSettingsStore } from '@/stores/settings.js';

const settingsStore = useSettingsStore();
const { t } = settingsStore;
</script>

<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="24px"
        height="16px"
        :title="t('Add_Location')"
      >
        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 15.5S.5 10.5.5 6a5.5 5.5 0 0 1 10.909-1" />
            <circle cx="6" cy="6" r="1.5" />
            <circle cx="11.5" cy="11.5" r="4" />
            <path d="M11.5 9.5v4m-2-2h4" />
        </g>
    </svg>
</template>
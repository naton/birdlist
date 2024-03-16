<script setup>
import { useSettingsStore } from '@/stores/settings.js';

const settingsStore = useSettingsStore();
const { t } = settingsStore;
</script>

<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        width="16px"
        height="16px"
        viewBox="0 0 16 16"
        stroke-width="2"
        :title="t('Fetching_Location')"
      >
        <g stroke-width="2" transform="translate(0, 0)">
            <g class="nc-loop-ripple-16-icon-o" stroke-width="2">
                <circle cx="8" cy="8" fill="none" r="9" stroke="currentColor" stroke-width="2"></circle>
                <circle cx="8" cy="8" fill="none" r="9" stroke="currentColor" stroke-width="2"></circle>
            </g>
        </g>
    </svg>
</template>
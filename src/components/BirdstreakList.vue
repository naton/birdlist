<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
const settingsStore = useSettingsStore()
const { t } = settingsStore

const startDate = new Date(2024, 2, 1)
const dayInterval = 2;
const endDate = new Date();
const dateRange = computed(() => {
    const dates = []
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + dayInterval)) {
        dates.push(date.toDateString())
    }
    return dates
});
</script>

<template>
    <div>
        <p>{{ t("Birdstreak") }}</p>
        <div v-for="date in dateRange" :key="date">
            {{ date }}
        </div>
    </div>
</template>
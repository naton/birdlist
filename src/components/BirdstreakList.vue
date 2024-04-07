<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { formatDate } from "@/helpers";
import { useObservationsStore } from "@/stores/observations.js";
const observationsStore = useObservationsStore();
const { allListObservations } = storeToRefs(observationsStore);

const startDate = new Date("2024-03-01")
const dayInterval = 2;
const endDate = new Date()
const dateRange = computed(() => {
    const dates = []
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + dayInterval)) {
        let dateGroup = []
        for (let i = 0; i < dayInterval; i++) {
            let dateCopy = new Date(date)
            dateCopy.setDate(dateCopy.getDate() + i);
            dateGroup.push(dateCopy)
        }
        dates.push(dateGroup)
    }
    return dates
});

function getAllListObservationsOnDates(dates) {
    return allListObservations.value.filter(obs => {
        return dates.some(date => {
            return obs.date.toISOString().substring(0, 10) === date.toISOString().substring(0, 10)
        })
    })
}

function getListObservationOnDate(date) {
    return allListObservations.value.find(obs => {
        return obs.date.toISOString().substring(0, 10) === date.toISOString().substring(0, 10)
    })
}

</script>

<template>
    <table class="table">
        <tbody v-for="(dateGroups, rangeIndex) in dateRange" :key="rangeIndex" class="date-group">
            <tr v-for="(date, groupIndex) in dateGroups" :key="date">
                <td>{{ formatDate(date) }}</td>
                <td v-if="rangeIndex === dateRange.length - 1" :rowspan="dayInterval">
                    <select v-if="groupIndex === 0">
                        <option v-for="observation in getAllListObservationsOnDates(dateGroups)" :key="observation.date" :value="observation.name">{{ observation.name }}</option>
                    </select>
                </td>
                <td v-else :rowspan="dayInterval">
                    {{ getListObservationOnDate(date) }}
                </td>
            </tr>
        </tbody>
    </table>
</template>

<style>
.table {
    width: 100%;
    border-collapse: collapse;
}

.date-group tr:first-child td {
    border-top: 1px solid var(--color-border);
}
</style>
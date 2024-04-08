<script setup>
import { ref, computed } from 'vue'
import { formatDate } from "@/helpers";
import { useSettingsStore } from '@/stores/settings.js'
import { useObservationsStore } from "@/stores/observations.js";
import { groupBy } from "@/helpers";
import LockIcon from "./icons/LockIcon.vue";

const props = defineProps(["list", "comments", "lastLockedObservation", "observations"]);
const settingsStore = useSettingsStore();
const { t, currentUser } = settingsStore;

const observationsStore = useObservationsStore();
const { lockObservation } = observationsStore;

// startDate is the list's start date or the current date
const startDate = props.list.startDate ? new Date(props.list.startDate) : new Date()
// endDate can't be later than the current date
const endDate = Math.min(props.list.endDate ? new Date(props.list.endDate) : new Date(), new Date());
const reportInterval = props.list.reportInterval || 2
const dateRange = computed(() => {
    const dates = []
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + reportInterval)) {
        let dateGroup = []
        for (let i = 0; i < reportInterval; i++) {
            let dateCopy = new Date(date)
            dateCopy.setDate(dateCopy.getDate() + i);
            dateGroup.push(dateCopy)
        }
        dates.push(dateGroup)
    }
    return dates
});

const obsToLock = ref(props.lastLockedObservation)

const selectedUser = ref(null);

const users = computed(() => {
    const names = [...new Set(props.observations.map((obs) => obs.owner))].sort();
    let users = [];
    let highestScore = 0;

    names.forEach((name) => {
        const score = Object.keys(
            groupBy(props.observations.filter((obs) => obs.owner === name), "name")
        ).length;

        users.push({
            name,
            score,
        });
    });

    users.forEach((user) => {
        if (user.score === highestScore) {
            user.leader = true;
        }
    });

    return users.sort((a, b) => b.score - a.score);
});

const observationsByUser = computed(() => {
    let obses = props.observations;
    if (selectedUser.value === null) {
        return obses.sort((a, b) => b.date - a.date);
    } else {
        return obses.filter((obs) => obs.owner === selectedUser.value).sort((a, b) => b.date - a.date);
    }
});

function getAllListObservationsOnDates(dates) {
    return observationsByUser.value.filter(obs => {
        return dates.some(date => {
            return obs.date.toISOString().substring(0, 10) === date.toISOString().substring(0, 10)
        })
    })
}

function getLockedListObservationOnDate(date) {
    return observationsByUser.value.find(obs => {
        return obs.date.toISOString().substring(0, 10) === date.toISOString().substring(0, 10) && obs.locked
    })
}
</script>

<template>
    <div class="birdstreak-list">
        <nav>
            <button v-for="user in users" :key="user.name" @click="selectedUser = selectedUser === user.name ? null : user.name" :class="selectedUser === user.name && 'active'">{{ user.name }}</button>
        </nav>
    </div>

    <div class="birdstreak-list">
        <table class="table">
            <tbody v-for="(dateGroups, rangeIndex) in dateRange" :key="rangeIndex" class="date-group">
                <tr v-for="(date, groupIndex) in dateGroups" :key="date">
                    <td>{{ formatDate(date) }}</td>
                    <td v-if="rangeIndex === dateRange.length - 1 && selectedUser === currentUser.name" :rowspan="groupIndex === 0 ? reportInterval : null">
                        <form v-if="groupIndex === 0" @submit.prevent="lockObservation(obsToLock, getAllListObservationsOnDates(dateGroups))" class="flex">
                            <select v-model="obsToLock" required>
                                <option value="" disabled>{{ t("Select_Observation") }}</option>
                                <option v-for="obs in getAllListObservationsOnDates(dateGroups)" :key="obs.date" :value="obs.id">{{ obs.name }}</option>
                            </select>
                            <button type="submit"><lock-icon /> {{ t("Lock") }}</button>
                        </form>
                    </td>
                    <td v-else>
                        <template v-if="getLockedListObservationOnDate(date)">
                            <lock-icon />
                            {{ getLockedListObservationOnDate(date).name }}
                        </template>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style>
.birdstreak-list {
    margin: 1rem;
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
}

button.active {
    color: var(--color-text-dim);
    background: var(--color-background-dim);
}

.table {
    width: 100%;
    border-collapse: collapse;
}

.table td {
    padding: 0.15em 0 0.25em;
}

.table td:first-child {
    width: 10rem;
}

.date-group:not(:first-child) tr:first-child td {
    border-top: 1px dashed var(--color-border);
}

.flex {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.flex button {
    flex: 1 0 auto;
    min-height: 2.4rem;
}

select:empty+button {
    opacity: 0.4;
    filter: grayscale(1);
    pointer-events: none;
}
</style>
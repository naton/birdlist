<script setup>
import { ref, computed } from 'vue'
import { formatDate } from "@/helpers";
import { useSettingsStore } from '@/stores/settings.js'
import { useObservationsStore } from "@/stores/observations.js";
import UserNav from "./UserNav.vue";
import LockIcon from "./icons/LockIcon.vue";

const props = defineProps(["list", "comments", "lastLockedObservation", "observations"]);
const settingsStore = useSettingsStore();
const { t, currentUser } = settingsStore;

const observationsStore = useObservationsStore();
const { lockObservation } = observationsStore;

// startDate is the list's start date or the current date
const startDate = new Date(props.list.startDate)
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
const currentLeader = ref("");

// create a function that returns the longest unbroken period of observations from start date to current date
function getLongestStreak(name) {
    let streak = 0;
    let longestStreak = 0;
    const obsesByUser = props.observations.filter((obs) => obs.owner === name);

    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + reportInterval)) {
        let dateGroup = []
        for (let i = 0; i < reportInterval; i++) {
            let dateCopy = new Date(date)
            dateCopy.setDate(dateCopy.getDate() + i);
            dateGroup.push(dateCopy)
        }
        if (dateGroup.some(date => {
            return obsesByUser.some(obs => {
                return obs.date.toISOString().substring(0, 10) === date.toISOString().substring(0, 10)
            })})) {
            streak++;
        } else {
            longestStreak = Math.max(streak, longestStreak);
            streak = 0;
        }
    }

    return Math.max(streak, longestStreak);
}

const users = computed(() => {
    const names = [...new Set(props.observations.map((obs) => obs.owner))].sort();
    let users = [];
    let highestScore = 0;
    let score = 0;
    let leader = false;

    names.forEach((name) => {
        score = getLongestStreak(name);
        highestScore = score > highestScore ? score : highestScore;
        users.push({
            name,
            score,
            leader
        });
    });

    users.forEach((user) => {
        if (user.score === highestScore) {
            user.leader = true;
            currentLeader.value = user.name;
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

function changeUser(user) {
  selectedUser.value = user === selectedUser.value ? null : user;
}

function getAllListObservationsOnDates(dates) {
    return observationsByUser.value.filter(obs => {
        return dates.some(date => {
            return obs.date.toISOString().substring(0, 10) === date.toISOString().substring(0, 10)
        })
    })
}

function getLockedListObservationOnDate(date) {
    return observationsByUser.value.filter(obs => {
        return obs.date.toISOString().substring(0, 10) === date.toISOString().substring(0, 10) && obs.locked
    })
}
</script>

<template>
    <user-nav :users="users" :selectedUser="selectedUser" @changeUser="changeUser" />
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
                            <button type="submit"><lock-icon />{{ t("Lock") }}</button>
                        </form>
                    </td>
                    <td v-else>
                        <template v-if="getLockedListObservationOnDate(date).length">
                            <lock-icon /><span v-for="obs in getLockedListObservationOnDate(date)" :key="obs.date">{{ obs.name }}</span>
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

.table td svg {
    margin-right: 0.25em;
}

.table td span ~ span::before {
    content: ', '; 
}

.table td:first-child {
    width: 10rem;
}

.date-group:not(:first-child) tr:first-child td {
    border-top: 2px solid var(--color-background-dim);
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
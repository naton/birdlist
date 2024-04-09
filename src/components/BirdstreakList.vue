<script setup>
import { ref, computed, watch } from 'vue'
import { formatDate } from "@/helpers";
import { useSettingsStore } from '@/stores/settings.js'
import { useObservationsStore } from "@/stores/observations.js";
import UserNav from "./UserNav.vue";
import StreakIcon from "./icons/StreakIcon.vue";
import LockIcon from "./icons/LockIcon.vue";

const emit = defineEmits(["newLeader"]);
const props = defineProps(["list", "comments", "lastLockedObservation", "observations"]);
const settingsStore = useSettingsStore();
const { t, currentUser } = settingsStore;

const observationsStore = useObservationsStore();
const { lockObservation } = observationsStore;

const startDate = new Date(props.list?.startDate);
const endDate = new Date(props.list?.endDate) > new Date() ? new Date() : new Date(props.list.endDate);
const reportInterval = props.list.reportInterval || 2;

const dateRange = computed(() => {
    let currentDate = new Date(startDate); // Create a copy of startDate
    let currentEndDate = new Date(endDate); // Create a copy of endDate
    const dates = [];

    for (let date = currentDate; date <= currentEndDate; date.setDate(date.getDate() + reportInterval)) {
        let dateGroup = []
        for (let i = 0; i < reportInterval; i++) {
            let dateCopy = new Date(date)
            dateCopy.setDate(dateCopy.getDate() + i);
            dateGroup.push(dateCopy)
        }
        dates.push(dateGroup)
    }

    return dates;
});

const obsToLock = ref(props.lastLockedObservation)
const selectedUser = ref(null);
const currentLeader = ref("");

// create a function that returns the longest unbroken period of observations from start date to current date
function getLongestStreak(name) {
    let streak = 0;
    let longestStreak = 0;
    const obsesByUser = props.observations.filter((obs) => obs.owner === name);

    dateRange.value.forEach(dateGroups => {
        if (dateGroups.some(date => {
            return obsesByUser.some(obs => {
                return obs.date.toISOString().substring(0, 10) === date.toISOString().substring(0, 10)
            })
        })) {
            streak++;
        } else {
            longestStreak = Math.max(streak, longestStreak);
            streak = 0;
        }
    })

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

watch(currentLeader, (newLeader) => {
  // Announce new leader only if you’re not alone
  if (users.value.length > 1 && newLeader === currentUser.value?.name) {
    emit("newLeader");
  }
});

</script>

<template>
    <user-nav :users="users" :selectedUser="selectedUser" @changeUser="changeUser" />
    <div class="birdstreak-list">
        <table class="table">
            <caption><streak-icon />{{ formatDate(props.list.startDate) }} – {{ formatDate(props.list.endDate) }}</caption>
            <thead>
                <tr>
                    <th>{{ t("Date") }}</th>
                    <th>{{ t("Observations") }}</th>
                </tr>
            </thead>
            <tbody v-for="(dateGroups, rangeIndex) in dateRange" :key="rangeIndex" class="date-group">
                <tr v-for="(date, groupIndex) in dateGroups" :key="date">
                    <td>{{ formatDate(date) }}</td>
                    <td v-if="rangeIndex === dateRange.length - 1" :rowspan="groupIndex === 0 ? reportInterval : null">
                        <template v-if="groupIndex === 0">
                            <form v-if="getAllListObservationsOnDates(dateGroups).length" @submit.prevent="lockObservation(obsToLock, getAllListObservationsOnDates(dateGroups))" class="flex">
                                <select v-model="obsToLock" required>
                                    <option value="" disabled>{{ t("Select_Observation") }}</option>
                                    <option v-for="obs in getAllListObservationsOnDates(dateGroups)" :key="obs.date" :value="obs.id">{{ obs.name }}</option>
                                </select>
                                <button type="submit"><lock-icon />{{ t("Lock") }}</button>
                            </form>
                            <div v-else>
                                {{ t("No_Observations") }}
                            </div>
                        </template>
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

.table caption {
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    border-radius: var(--radius);
    background: var(--color-background-dim);
    font-weight: bold;
}

.table caption svg {
    vertical-align: top;
    margin-right: 0.25rem;
}

.table th {
    padding-bottom: 0.25rem;
    font-weight: bold;
    text-align: left;
}

.table td {
    padding: 0.15em 0 0.25em;
}

.table td svg {
    margin-right: 0.25em;
}

.table td span~span::before {
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
<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import UserIcon from "../components/icons/UserIcon.vue";
import VerifiedIcon from "../components/icons/VerifiedIcon.vue";
import { formatDate } from "../helpers";
import { db } from "../db";
import { useSettingsStore } from '../stores/settings.js'
import { useFriendsStore } from '../stores/friends.js'
import { useListsStore } from '../stores/lists.js'
import { useObservationsStore } from '../stores/observations.js'
import { useCommentsStore } from '../stores/comments.js'

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { currentUser, isUserLoggedIn, isPremiumUser } = storeToRefs(settingsStore)

const friendsStore = useFriendsStore()
const { allFriends } = storeToRefs(friendsStore)

const listsStore = useListsStore()
const { getListMembers } = listsStore
const { allMyLists } = storeToRefs(listsStore)

const observationsStore = useObservationsStore()
const { allMyObservations } = storeToRefs(observationsStore)

const commentsStore = useCommentsStore()
const { allMyComments } = storeToRefs(commentsStore)

const hasAddedAnObservation = computed(() => allMyObservations.value.length > 0)
const hasAddedAList = computed(() => allMyLists.value.length > 0)
const hasAddedAFriend = computed(() => allFriends.value.length > 0)
const hasAddedMembersToAnyList = computed(() => {
    return allMyLists.value.some(async list => {
        return await getListMembers(list.id).length > 0
    })
})
const hasAddedAComment = computed(() => allMyComments.value.length > 0)

function logout() {
    db.table('$logins').clear();
    document.location.href = "/";
}
</script>

<template>
    <details class="help" :open="!isUserLoggedIn">
        <summary>{{ t("What_Is_This") }}</summary>
        <p v-html="t('Account_Help')"></p>
        <a v-if="!isPremiumUser" href="https://ko-fi.com/birdlist" target="_blank" class="donate">{{ t("Donate_For_Premium") }}</a>
    </details>
    <div v-if="isUserLoggedIn" class="flex margin-top margin-bottom">
        {{ t("Account_Type") }}:
        <span v-if="isPremiumUser" class="pill account-type">{{ t('Premium') }} <verified-icon /></span>
        <span v-else class="pill account-type">{{ t('Trial') }}</span>
        <span v-if="isPremiumUser && currentUser.license.validUntil" class="pill pill--extra">…{{ formatDate(currentUser.license.validUntil) }}</span>
        <span v-if="!isPremiumUser && currentUser.license.evalDaysLeft" class="pill pill--extra">{{ currentUser.license.evalDaysLeft }} {{ t("Days_Left").toLowerCase() }}</span>
    </div>

    <div>
        <h2 class="center">{{ t("Profile_Status") }}</h2>
        <ul class="profile-steps margin-bottom">
            <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
                    <polyline v-if="hasAddedAnObservation" fill="none" stroke="var(--color-text)" stroke-width="2" points=" 9,17 13,21 23,11 "></polyline>
                    <circle fill="none" stroke="var(--color-text)" stroke-width="2" cx="16" cy="16" r="15"></circle>
                </svg>
                {{ t("HasAddedAnObservation") }}
            </li>
            <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
                    <polyline v-if="hasAddedAList" fill="none" stroke="var(--color-text)" stroke-width="2" points=" 9,17 13,21 23,11 "></polyline>
                    <circle fill="none" stroke="var(--color-text)" stroke-width="2" cx="16" cy="16" r="15"></circle>
                </svg>
                {{ t("HasAddedAList") }}
            </li>
            <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
                    <polyline v-if="hasAddedAFriend" fill="none" stroke="var(--color-text)" stroke-width="2" points=" 9,17 13,21 23,11 "></polyline>
                    <circle fill="none" stroke="var(--color-text)" stroke-width="2" cx="16" cy="16" r="15"></circle>
                </svg>
                {{ t("HasAddedAFriend") }}
            </li>
            <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
                    <polyline v-if="hasAddedMembersToAnyList" fill="none" stroke="var(--color-text)" stroke-width="2" points=" 9,17 13,21 23,11 "></polyline>
                    <circle fill="none" stroke="var(--color-text)" stroke-width="2" cx="16" cy="16" r="15"></circle>
                </svg>
                {{ t("HasAddedMembersToAnyList") }}
            </li>
            <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
                    <polyline v-if="hasAddedAComment" fill="none" stroke="var(--color-text)" stroke-width="2" points=" 9,17 13,21 23,11 "></polyline>
                    <circle fill="none" stroke="var(--color-text)" stroke-width="2" cx="16" cy="16" r="15"></circle>
                </svg>
                {{ t("HasAddedAComment") }}
            </li>
        </ul>
    </div>
    <div>
        <h2 class="center">{{ t("Logged_In_As") }}:</h2>
        <button v-if="isUserLoggedIn" type="button" class="secondary logout" @click="logout()">{{ t("Logout") }}</button>
        <button v-else type="button" class="secondary login" @click="db.cloud.login()">{{ t("Login") }}</button>
        <div class="grid margin-bottom">
            <user-icon :class="!isUserLoggedIn && 'dimmed'" />
            <p class="user-name">
                {{ isUserLoggedIn ? currentUser.userId : t("Not_Logged_In") }}
            </p>
        </div>
    </div>
</template>

<style>
.user-name {
    text-wrap: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1.2rem;
}

.donate {
    display: block;
    margin: 0.5rem 1rem;
    padding: 0.2rem 0.8rem 0.2rem 2.4rem;
    background: url('https://ko-fi.com/favicon.png') no-repeat 0.5rem 0.25rem / 1.5rem auto;
}

.profile-steps {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.profile-steps li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.2rem 0;
}

.login,
.logout {
    float: right;
    min-height: 2.4rem;
}

.account-type {
    position: relative;
    z-index: 1;
}

.pill.pill--extra {
    position: relative;
    left: -2.25rem;
    padding-left: 2rem;
    color: var(--color-background);
    background-color: var(--color-link);
}

.pill svg {
    margin: -0.4em -0.2em -0.4em 0.1em;
}
</style>
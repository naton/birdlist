<script setup>
import { storeToRefs } from 'pinia'
import { db } from "../db";
import { useSettingsStore } from '../stores/settings.js'
import { useBirdsStore } from '../stores/birds.js'
import { useMessagesStore } from '../stores/messages.js'
import UserIcon from "../components/icons/UserIcon.vue";
import VerifiedIcon from "../components/icons/VerifiedIcon.vue";
import NorthAmericaMap from "../components/icons/NorthAmericaMap.vue";
import EuropeMap from "../components/icons/EuropeMap.vue";
import SwedenMap from "../components/icons/SwedenMap.vue";

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { locale, hue, currentUser, isUserLoggedIn, isPremiumUser } = storeToRefs(settingsStore)

const birdsStore = useBirdsStore()
const { loadAllBirds } = birdsStore

const messagesStore = useMessagesStore()
const { addMessage } = messagesStore

async function switchLocale(newLocale) {
    locale.value = newLocale
    await loadAllBirds(newLocale)
    setTimeout(() => addMessage(t("Birds_Loaded")), 100)
}

function logout() {
    db.table('$logins').clear();
    document.location.href = "/";
}
</script>

<template>
    <div class="body">
        <div class="body-content settings">
            <header>
                <h1>{{ t("Settings") }}</h1>
                <button v-if="isUserLoggedIn" type="button" class="secondary logout" @click="logout()">{{ t("Logout") }}</button>
                <button v-else type="button" class="secondary login" @click="db.cloud.login()">{{ t("Login") }}</button>
                <div class="grid">
                    <user-icon :class="!isUserLoggedIn && 'dimmed'" />
                    <h2 class="user-name">
                        {{ isUserLoggedIn ? currentUser.userId : t("Not_Logged_In") }}
                        <verified-icon v-if="currentUser.claims.email_verified" />
                    </h2>
                </div>
                <div v-if="isUserLoggedIn" class="flex margin-top margin-bottom">
                    {{ t("Account_Type") }}: <span class="pill">{{ isPremiumUser ? t('Premium') : t('Free') }}</span>
                    <a v-if="!isPremiumUser" href="https://ko-fi.com/birdlist" target="_blank" class="donate">Donate for Premium</a>
                </div>
                <details class="help" :open="!isUserLoggedIn">
                    <summary>{{ t("What_Is_This") }}</summary>
                    <p v-html="t('Account_Help')"></p>
                </details>
            </header>
            <div>
                <label for="hue">{{ t("Theme_Color") }}</label>
                <input id="hue" type="range" v-model="hue" min="0" max="360">
            </div>
            <div>
                <label for="locale">{{ t("Language") }}</label>
                <select id="locale" v-model="locale">
                    <option value="sv-SE">Svenska</option>
                    <option value="en-GB" v-if="locale !== 'en-US'">English</option>
                    <option value="en-US" v-else>English</option>
                </select>
            </div>
            <h3 class="center">{{ t("Use_Bird_Suggestions_From") }}:</h3>
            <div class="flex map-buttons">
                <button type="button" @click="switchLocale('en-US')" class="map-button" :class="locale === 'en-US' && 'selected'">
                    <north-america-map />
                </button>
                <button type="button" @click="switchLocale('en-GB')" class="map-button" :class="locale === 'en-GB' && 'selected'">
                    <europe-map />
                </button>
                <button type="button" @click="switchLocale('sv-SE')" class="map-button" :class="locale === 'sv-SE' && 'selected'">
                    <sweden-map />
                </button>
            </div>
        </div>
    </div>
</template>

<style>
.body label {
    display: block;
}

.body-content.settings {
    display: grid;
    align-self: start;
    gap: 1.5rem;
    padding: 1rem;
}

.user-name {
    text-wrap: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1.4rem;
}

.user-name svg {
    margin-right: 0.5rem;
    vertical-align: middle;
}

.user-name svg.dimmed {
    opacity: 0.4;
}

input[type="range"] {
    width: 100%;
}

.donate {
    padding: 0.2rem 0.8rem 0.2rem 2.4rem;
    background: url('https://ko-fi.com/favicon.png') no-repeat 0.5rem 0.25rem / 1.5rem auto;
}

.login,
.logout {
    float: right;
    min-height: 2.4rem;
}

.map-buttons {
    justify-content: space-around;
    gap: 1rem;
}

.map-button {
    padding: 1rem;
    border: none;
    background: none;
}

.map-button.selected {
    outline: 2px solid var(--color-border);
    border-radius: var(--radius);
}

.map-button svg {
    width: 100%;
    height: auto;
    max-height: 4rem;
}
</style>
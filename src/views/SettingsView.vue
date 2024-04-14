<script setup>
import { storeToRefs } from 'pinia'
import { db } from "../db";
import { useSettingsStore } from '../stores/settings.js'
import UserIcon from "../components/icons/UserIcon.vue";
import VerifiedIcon from "../components/icons/VerifiedIcon.vue";

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { lang, hue, currentUser, isUserLoggedIn, isPremiumUser } = storeToRefs(settingsStore)

function logout() {
  db.table('$logins').clear();
  document.location.href = "/";
}
</script>

<template>
    <div class="body">
        <div class="body-content settings">
            <header>
                <transition name="fade-in">
                    <h1>{{ t("Settings") }}</h1>
                </transition>
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
                <label for="lang">{{ t("Language") }}</label>
                <select id="lang" v-model="lang">
                    <option value="sv">Svenska</option>
                    <option value="en">English</option>
                </select>
            </div>
            <div>
                <label for="hue">{{ t("Theme_Color") }}</label>
                <input id="hue" type="range" v-model="hue" min="0" max="360">
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
    min-height: 2.5rem;
}
</style>
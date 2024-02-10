<script setup>
import { storeToRefs } from 'pinia'
import { db } from "../db";
import { useSettingsStore } from '../stores/settings.js'

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { lang, currentUser } = storeToRefs(settingsStore)

function logout() {
  db.table('$logins').clear();
  document.location.href = "/";
}
</script>

<template>
    <div class="body">
        <div class="body-nav">
            <h1>{{ t("Settings") }}</h1>
            <button type="button" class="button" @click="logout()">{{ t("Logout") }}</button>
        </div>
        <div class="body-content settings">
            <label for="lang">{{ t("Language") }}</label>
            <select id="lang" v-model="lang">
                <option value="sv">Svenska</option>
                <option value="en">English</option>
            </select>
        </div>
    </div>
</template>

<style>
.body label {
    display: block;
}

.body-content select {
    all: unset;
    width: -webkit-fill-available;
    padding: 0.3em 0.7em;
    border: 1px solid;
    border-radius: var(--radius);
    background-color: var(--color-background-dim);
    background-image: url(data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xml:space='preserve' viewBox='0 0 386.257 386.257'%3E%3Cpath d='m0 96.879 193.129 192.5 193.128-192.5z'/%3E%3C/svg%3E);
    background-position: calc(100% - 0.5em) 50%;
    background-repeat: no-repeat;
    background-size: auto 50%;
}

.body-nav h1 {
    margin: auto auto auto 1rem;
    font-size: 1rem;
}

.body-content.settings {
    padding: 1rem;
}
</style>
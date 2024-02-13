<script setup>
import { storeToRefs } from 'pinia'
import { db } from "../db";
import { useSettingsStore } from '../stores/settings.js'

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { lang, hue } = storeToRefs(settingsStore)

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
    gap: 1rem;
    padding: 1rem;
}
</style>
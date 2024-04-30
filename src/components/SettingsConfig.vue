<script setup>
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '../stores/settings.js'
import { useBirdsStore } from '../stores/birds.js'
import { useMessagesStore } from '../stores/messages.js'
import NorthAmericaMap from "../components/icons/NorthAmericaMap.vue";
import EuropeMap from "../components/icons/EuropeMap.vue";
import SwedenMap from "../components/icons/SwedenMap.vue";

const settingsStore = useSettingsStore()
const { t, loadTexts } = settingsStore
const { locale, lang, hue } = storeToRefs(settingsStore)

const birdsStore = useBirdsStore()
const { loadAllBirds } = birdsStore

const messagesStore = useMessagesStore()
const { addMessage } = messagesStore

async function switchLocale(newLocale) {
    locale.value = newLocale
    lang.value = newLocale.split('-')[0]
    await loadAllBirds(newLocale)
    setTimeout(() => addMessage(t("Birds_Loaded")), 100)
}

watch(lang, async (newLang) => {
    document.documentElement.lang = newLang
    await loadTexts(newLang)
})
</script>

<template>
    <div>
        <label for="hue">{{ t("Theme_Color") }}</label>
        <input id="hue" type="range" v-model="hue" min="0" max="360">
    </div>
    <div class="margin-bottom">
        <label for="locale">{{ t("Language") }}</label>
        <select id="locale" v-model="lang">
            <option value="sv">Svenska</option>
            <option value="en">English</option>
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
</template>
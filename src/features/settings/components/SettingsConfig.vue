<script setup>
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useBirdsStore } from '@/stores/birds.js'
import { useMessagesStore } from '@/stores/messages.js'
import { useSettingsStore } from '@/stores/settings.js'
import EuropeMap from "@/shared/icons/EuropeMap.vue";
import NorthAmericaMap from "@/shared/icons/NorthAmericaMap.vue";
import SwedenMap from "@/shared/icons/SwedenMap.vue";

const settingsStore = useSettingsStore()
const { t, normalizeLanguage, normalizeRegion } = settingsStore
const { locale, lang, hue } = storeToRefs(settingsStore)

const birdsStore = useBirdsStore()
const { loadAllBirds } = birdsStore

const messagesStore = useMessagesStore()
const { addMessage } = messagesStore

async function switchLocale(newLocale) {
    const normalizedLocale = normalizeRegion(newLocale)
    locale.value = normalizedLocale
    await loadAllBirds(normalizedLocale, lang.value)
    setTimeout(() => addMessage(t("Birds_Loaded")), 100)
}

watch(lang, async (newLang) => {
    const normalizedLang = normalizeLanguage(newLang)

    if (newLang !== normalizedLang) {
        lang.value = normalizedLang
        return
    }

    document.documentElement.lang = normalizedLang
    await loadAllBirds(locale.value, normalizedLang)
})
</script>

<template>
    <h3 class="center">{{ t("Use_Bird_Suggestions_From") }}:</h3>
    <div class="flex map-buttons margin-bottom">
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
    <div class="margin-bottom">
        <label for="locale">{{ t("Language") }}</label>
        <select id="locale" v-model="lang">
            <option value="sv">Svenska</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
        </select>
    </div>
    <div class="margin-bottom">
        <label for="hue">{{ t("Theme_Color") }}</label>
        <input id="hue" type="range" v-model="hue" min="0" max="360">
    </div>
</template>

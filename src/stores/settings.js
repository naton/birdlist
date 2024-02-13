import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useObservable } from "@vueuse/rxjs";
import { db } from "../db";

export const useSettingsStore = defineStore('settings', () => {
    const lang = ref("sv")
    const hue = ref("45")
    const texts = ref({})
    const currentUser = useObservable(db.cloud.currentUser);

    function t(l10n_key, ...args) {
        const l10n = texts.value[l10n_key];

        if (args && typeof l10n === "function") {
            return l10n(...args);
        } else {
            return l10n ? l10n : `⚠️ ${l10n_key}`;
        }
    }

    async function loadTexts(lang) {
        texts.value = (await import(`@/assets/texts_${lang}.json`)).default[0];
    }

    watch(lang, (newLang) => {
        loadTexts(newLang);
    })

    watch(hue, (newHue) => {
        document.documentElement.style = `--hue: ${newHue}`;
    })

    return {
        lang,
        hue,
        texts,
        currentUser,
        t,
        loadTexts,
    }
}, {
    persist: {
        key: 'birdlist-settings',
        paths: ['lang', 'hue'],
    }
})
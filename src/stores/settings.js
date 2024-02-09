import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useObservable } from "@vueuse/rxjs";
import { db } from "../db";

export const useSettingsStore = defineStore('settings', () => {
    const lang = ref("sv")
    /* Me */
    const currentUser = useObservable(db.cloud.currentUser);

    return {
        lang,
        currentUser,
    }
}, {
    persist: {
        key: 'birdlist-settings',
        paths: ['lang'],
    }
})
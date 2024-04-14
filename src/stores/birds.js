import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useBirdsStore = defineStore('bird', () => {
    const birds = ref([])

    async function loadAllBirds(locale, callback) {
        birds.value = (await import(`@/assets/birds_${locale}.json`)).default
        if (callback) {
            callback()
        }
    }

    return {
        birds,
        loadAllBirds,
    }
})
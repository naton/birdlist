import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useBirdsStore = defineStore('bird', () => {
    const birds = ref([])

    async function loadAllBirds(locale) {
        birds.value = (await import(`@/assets/birds_${locale}.json`)).default
    }

    return {
        birds,
        loadAllBirds,
    }
})
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useBirdsStore = defineStore('bird', () => {
    const birds = ref([])

    async function loadAllBirds(lang) {
        birds.value = (await import(`@/assets/birds_${lang}.json`)).default
    }

    return {
        birds,
        loadAllBirds
    }
})
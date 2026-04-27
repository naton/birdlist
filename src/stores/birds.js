import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getBirdDisplayName } from "@/birdNames.js";

export const useBirdsStore = defineStore('bird', () => {
    const birds = ref([])

    async function loadAllBirds(market, language = market) {
        const marketBirds = (await import(`@/assets/birds_${market}.json`)).default;
        birds.value = marketBirds.map((bird) => ({
            ...bird,
            marketName: bird.name,
            name: getBirdDisplayName(bird, language),
        }));
    }

    return {
        birds,
        loadAllBirds,
    }
})

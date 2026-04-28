import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getBirdDisplayName } from "@/birdNames.js";
import { normalizeLanguage, normalizeRegion } from "@/stores/settings.js";

export const useBirdsStore = defineStore('bird', () => {
    const birds = ref([])

    async function loadAllBirds(region, language = region) {
        const normalizedRegion = normalizeRegion(region);
        const normalizedLanguage = normalizeLanguage(language);
        const regionBirds = (await import(`@/assets/birds_${normalizedRegion}.json`)).default;
        birds.value = regionBirds.map((bird) => ({
            ...bird,
            regionName: bird.name,
            name: getBirdDisplayName(bird, normalizedLanguage),
        }));
    }

    return {
        birds,
        loadAllBirds,
    }
})

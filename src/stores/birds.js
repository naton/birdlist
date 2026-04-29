import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getBirdDisplayName, normalizeBirdName } from "@/birdNames.js";
import { normalizeLanguage, normalizeRegion } from "@/stores/settings.js";

export const useBirdsStore = defineStore('bird', () => {
    const birds = ref([])

    async function loadAllBirds(region, language = region) {
        const normalizedRegion = normalizeRegion(region);
        const normalizedLanguage = normalizeLanguage(language);
        const regionLanguage = normalizedRegion.split("-")[0];
        const regionBirds = (await import(`@/assets/birds_${normalizedRegion}.json`)).default;
        const seenNames = new Set();
        birds.value = regionBirds.reduce((items, bird) => {
            const name = normalizedLanguage === regionLanguage
                ? bird.name
                : getBirdDisplayName(bird, normalizedLanguage);
            const nameKey = normalizeBirdName(name);

            if (!nameKey || seenNames.has(nameKey)) {
                return items;
            }

            seenNames.add(nameKey);
            items.push({
                ...bird,
                regionName: bird.name,
                name,
            });
            return items;
        }, []);
    }

    return {
        birds,
        loadAllBirds,
    }
})

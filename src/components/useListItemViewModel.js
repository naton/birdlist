import { computed } from "vue";
import { storeToRefs } from "pinia";
import { getBirdDisplayName } from "@/birdNames.js";
import { toPublicUserLabel } from "@/helpers";
import { useSettingsStore } from "@/stores/settings.js";

export function useListItemViewModel(props) {
  const settingsStore = useSettingsStore();
  const { lang } = storeToRefs(settingsStore);

  const isSpeciesMode = computed(() => props.mode === "species");
  const observations = computed(() => {
    return Array.isArray(props.obs) ? props.obs : props.obs ? [props.obs] : [];
  });

  const primaryObservation = computed(() => observations.value[0] || null);
  const selectedObservation = computed(() => {
    return isSpeciesMode.value
      ? observations.value[observations.value.length - 1] || null
      : primaryObservation.value;
  });

  const uniqueOwners = computed(() => {
    return [...new Set(observations.value.map((observation) => observation?.owner).filter(Boolean))];
  });

  const birdLabel = computed(() => {
    return primaryObservation.value
      ? getBirdDisplayName(primaryObservation.value, lang?.value || "en")
      : "";
  });

  function getOwnerLabel(owner) {
    return toPublicUserLabel(owner);
  }

  return {
    isSpeciesMode,
    observations,
    primaryObservation,
    selectedObservation,
    uniqueOwners,
    birdLabel,
    getOwnerLabel,
  };
}

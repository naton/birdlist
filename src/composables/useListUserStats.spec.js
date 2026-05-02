import { computed, ref } from "vue";
import { describe, expect, it } from "vitest";
import { useListUserStats } from "./useListUserStats.js";

describe("useListUserStats", () => {
  it("sorts species groups by localized bird names instead of latin names", () => {
    const observations = computed(() => [
      { id: "1", name: "Zebra Finch", latinName: "Aaa aaa", owner: "A", date: 1 },
      { id: "2", name: "Albatross", latinName: "Zzz zzz", owner: "A", date: 2 },
    ]);

    const { speciesByUser } = useListUserStats(observations, null, null, { languageRef: ref("en") });

    expect(speciesByUser.value.map((group) => group[0].name)).toEqual(["Albatross", "Zebra Finch"]);
  });
});

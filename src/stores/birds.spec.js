import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";

describe("birds store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("keeps Swedish regional crow suggestions distinct", async () => {
    const { useBirdsStore } = await import("./birds.js");
    const store = useBirdsStore();

    await store.loadAllBirds("sv-SE", "sv");

    const crowNames = store.birds
      .filter((bird) => bird.latinName === "Corvus corone")
      .map((bird) => bird.name);

    expect(crowNames).toContain("Gråkråka");
    expect(crowNames).toContain("Kråka");
    expect(crowNames).toContain("Svartkråka");
    expect(store.birds.filter((bird) => bird.name === "Kråka")).toHaveLength(1);
  });

  it("dedupes localized names when region and language differ", async () => {
    const { useBirdsStore } = await import("./birds.js");
    const store = useBirdsStore();

    await store.loadAllBirds("sv-SE", "de");

    const names = store.birds.map((bird) => bird.name);
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);

    expect(duplicateNames).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
  findBirdSpeciesByName,
  getBirdDisplayName,
  getBirdLatinName,
} from "./birdNames.js";

describe("bird name lookup", () => {
  it("logs Swedish duva and tamduva as domestic pigeon", () => {
    expect(getBirdLatinName("duva")).toBe("Columba livia domestica");
    expect(getBirdLatinName("tamduva")).toBe("Columba livia domestica");
    expect(getBirdDisplayName({ latinName: "Columba livia domestica" }, "sv")).toBe("Tamduva");
  });

  it("keeps Swedish klippduva as rock dove", () => {
    expect(getBirdLatinName("klippduva")).toBe("Columba livia");
    expect(getBirdDisplayName({ latinName: "Columba livia" }, "sv")).toBe("Klippduva");
  });

  it("keeps both pigeon species available in lookup data", () => {
    expect(findBirdSpeciesByName("duva")?.latinName).toBe("Columba livia domestica");
    expect(findBirdSpeciesByName("klippduva")?.latinName).toBe("Columba livia");
  });
});

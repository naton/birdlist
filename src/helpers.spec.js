import { describe, expect, it } from "vitest";
import { toPublicUserLabel, toSafeUserLabel } from "./helpers";

describe("user label helpers", () => {
  it("masks email addresses with a stable pseudonym", () => {
    const pseudonym = toPublicUserLabel("anton@example.com");
    expect(pseudonym).toMatch(/^Birder [0-9A-F]{4}$/);
    expect(pseudonym).toBe(toPublicUserLabel("anton@example.com"));
  });

  it("keeps non-email labels unchanged", () => {
    expect(toPublicUserLabel("Anton")).toBe("Anton");
  });

  it("prefers friendly aliases over pseudonyms", () => {
    expect(toSafeUserLabel("anton@example.com", "Anton")).toBe("Anton");
  });

  it("masks raw email when no friendly alias exists", () => {
    expect(toSafeUserLabel("anton@example.com", "anton@example.com")).toMatch(/^Birder [0-9A-F]{4}$/);
  });
});

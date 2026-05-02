import { describe, expect, it, vi } from "vitest";
import { formatDate, toPublicUserLabel, toSafeUserLabel } from "./helpers";

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

describe("date helpers", () => {
  it("keeps weekday for dates in the current year", () => {
    vi.setSystemTime(new Date("2026-05-02T12:00:00Z"));

    expect(formatDate(new Date("2026-05-25T12:00:00Z"))).toMatch(/måndag|Monday/i);

    vi.useRealTimers();
  });

  it("shows year for dates outside the current year", () => {
    vi.setSystemTime(new Date("2026-05-02T12:00:00Z"));

    expect(formatDate(new Date("2025-05-25T12:00:00Z"))).toContain("2025");

    vi.useRealTimers();
  });
});

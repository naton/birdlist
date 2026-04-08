import { describe, expect, it, vi } from "vitest";
import { getIdleScheduler, scheduleRoutePrefetch } from "./prefetch";

describe("route prefetch", () => {
  it("schedules and runs route loaders", async () => {
    const firstLoader = vi.fn(() => Promise.resolve());
    const secondLoader = vi.fn(() => Promise.resolve());
    const scheduler = vi.fn((callback) => callback());

    scheduleRoutePrefetch([firstLoader, secondLoader], scheduler);

    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(firstLoader).toHaveBeenCalledTimes(1);
    expect(secondLoader).toHaveBeenCalledTimes(1);
  });

  it("falls back to setTimeout when requestIdleCallback is unavailable", () => {
    const scheduler = getIdleScheduler();
    expect(typeof scheduler).toBe("function");
  });
});

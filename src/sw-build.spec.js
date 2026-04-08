import { describe, expect, it } from "vitest";
import { createSwVersion, renderServiceWorkerSource } from "../scripts/prepare-sw.cjs";

describe("service worker build preparation", () => {
  it("formats a UTC-based build version", () => {
    const version = createSwVersion(new Date("2026-04-08T15:23:45Z"));
    expect(version).toBe("2026.04.08.152345");
  });

  it("injects the generated version into the service worker template", () => {
    const rendered = renderServiceWorkerSource('const CACHE_VERSION = "__SW_VERSION__";', "2026.04.08.152345");
    expect(rendered).toContain('const CACHE_VERSION = "2026.04.08.152345";');
    expect(rendered).not.toContain("__SW_VERSION__");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";

vi.mock("@/stores/settings.js", async () => {
  const { defineStore } = await import("pinia");
  const useSettingsStore = defineStore("settings", () => ({
    t: (key) => key,
  }));
  return { useSettingsStore };
});

describe("ListInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it("renders list metadata and extra action slot", async () => {
    const ListInfo = (await import("./ListInfo.vue")).default;
    const wrapper = mount(ListInfo, {
      props: {
        list: {
          id: "list-1",
          title: "My List",
          description: "A nice list",
          owner: "friend@example.com",
        },
        ownerLabel: "Friend",
        expanded: true,
      },
      slots: {
        extra: "<button class='fake-menu'>menu</button>",
      },
    });

    expect(wrapper.text()).toContain("My List");
    expect(wrapper.text()).toContain("Created_By");
    expect(wrapper.text()).toContain("Friend");
    expect(wrapper.text()).not.toContain("friend@example.com");
    expect(wrapper.find(".fake-menu").exists()).toBe(true);
  });

  it("emits expanded model updates when toggled", async () => {
    const ListInfo = (await import("./ListInfo.vue")).default;
    const wrapper = mount(ListInfo, {
      props: {
        list: { id: "list-1", title: "My List" },
        ownerLabel: "Me",
        expanded: true,
      },
    });

    await wrapper.find("details").trigger("click");

    expect(wrapper.emitted("update:expanded")).toEqual([[false]]);
  });
});

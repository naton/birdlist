import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";

const currentListRef = ref({
  id: "list-1",
  title: "My List",
  description: "A nice list",
  owner: "friend@example.com",
});
const currentListExpandedRef = ref(true);

vi.mock("@/stores/settings.js", async () => {
  const { defineStore } = await import("pinia");
  const useSettingsStore = defineStore("settings", () => ({
    t: (key) => key,
  }));
  return { useSettingsStore };
});

vi.mock("@/stores/lists.js", async () => {
  const { defineStore } = await import("pinia");
  const useListsStore = defineStore("list", () => ({
    isOwnedByCurrentUser: () => false,
    currentList: currentListRef,
    currentListExpanded: currentListExpandedRef,
  }));
  return { useListsStore };
});

vi.mock("@/stores/friends.js", async () => {
  const { defineStore } = await import("pinia");
  const useFriendsStore = defineStore("friend", () => ({
    getFriendlyName: (name) => `friendly-${name}`,
  }));
  return { useFriendsStore };
});

describe("ListInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it("renders list metadata and extra action slot", async () => {
    const ListInfo = (await import("./ListInfo.vue")).default;
    const wrapper = mount(ListInfo, {
      slots: {
        extra: "<button class='fake-menu'>menu</button>",
      },
    });

    expect(wrapper.text()).toContain("My List");
    expect(wrapper.text()).toContain("Created_By");
    expect(wrapper.text()).toContain("friendly-friend@example.com");
    expect(wrapper.find(".fake-menu").exists()).toBe(true);
  });
});

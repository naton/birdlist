import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, computed } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";

const currentUserRef = ref({
  userId: "anton@example.com",
  name: "anton@example.com",
  license: {},
});

vi.mock("@/db", () => ({
  db: {
    table: () => ({
      clear: vi.fn(),
    }),
  },
}));

vi.mock("@/stores/settings.js", async () => {
  const { defineStore } = await import("pinia");
  const useSettingsStore = defineStore("settings", () => ({
    t: (key) => key,
    currentUser: currentUserRef,
    isUserLoggedIn: computed(() => true),
    isPremiumUser: computed(() => false),
  }));
  return { useSettingsStore };
});

vi.mock("@/stores/friends.js", async () => {
  const { defineStore } = await import("pinia");
  const useFriendsStore = defineStore("friends", () => ({
    allFriends: ref([]),
  }));
  return { useFriendsStore };
});

vi.mock("@/stores/lists.js", async () => {
  const { defineStore } = await import("pinia");
  const useListsStore = defineStore("lists", () => ({
    getListMembers: vi.fn(),
    allMyLists: ref([]),
  }));
  return { useListsStore };
});

vi.mock("@/stores/observations.js", async () => {
  const { defineStore } = await import("pinia");
  const useObservationsStore = defineStore("observations", () => ({
    allMyObservations: ref([]),
  }));
  return { useObservationsStore };
});

vi.mock("@/stores/comments.js", async () => {
  const { defineStore } = await import("pinia");
  const useCommentsStore = defineStore("comments", () => ({
    allMyComments: ref([]),
  }));
  return { useCommentsStore };
});

describe("SettingsAccount", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    currentUserRef.value = {
      userId: "anton@example.com",
      name: "anton@example.com",
      license: {},
    };
  });

  it("shows the raw email in the account label", async () => {
    const SettingsAccount = (await import("./SettingsAccount.vue")).default;
    const wrapper = mount(SettingsAccount, {
      global: {
        stubs: {
          UserIcon: true,
          VerifiedIcon: true,
        },
      },
    });

    expect(wrapper.text()).toContain("anton@example.com");
  });
});

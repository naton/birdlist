import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";

const currentUserRef = ref({
  userId: "user-1",
  email: "user@example.com",
  name: "User One",
});

const getFriendlyNameMock = vi.fn((name) => name);

vi.mock("@/stores/settings.js", async () => {
  const { defineStore } = await import("pinia");
  const useSettingsStore = defineStore("settings", () => ({
    currentUser: currentUserRef,
  }));
  return { useSettingsStore };
});

vi.mock("@/stores/friends.js", async () => {
  const { defineStore } = await import("pinia");
  const useFriendsStore = defineStore("friend", () => ({
    getFriendlyName: getFriendlyNameMock,
  }));
  return { useFriendsStore };
});

async function mountUserNav(users, selectedUser = null) {
  const UserNav = (await import("./UserNav.vue")).default;
  let selected = selectedUser;

  const wrapper = mount(UserNav, {
    props: {
      users,
      selectedUser: selected,
      "onUpdate:selectedUser": async (value) => {
        selected = value;
        await wrapper.setProps({ selectedUser: value });
      },
    },
    global: {
      stubs: {
        UserInitial: {
          props: ["user", "score", "leader"],
          template: "<div class='user-initial'><slot /></div>",
        },
        TransitionGroup: {
          template: "<div><slot /></div>",
        },
      },
    },
  });

  return { wrapper, getSelected: () => selected };
}

describe("UserNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    currentUserRef.value = {
      userId: "user-1",
      email: "user@example.com",
      name: "User One",
    };
  });

  it("renders user nav when a single user exists", async () => {
    const { wrapper } = await mountUserNav([
      { name: "user@example.com", score: 1, leader: true },
    ]);

    expect(wrapper.find("nav.user-nav").exists()).toBe(true);
    expect(wrapper.findAll("button.user-button")).toHaveLength(1);
  });

  it("marks current user via email alias", async () => {
    const { wrapper } = await mountUserNav([
      { name: "user@example.com", score: 1, leader: true },
    ]);

    expect(wrapper.find(".me").exists()).toBe(true);
  });

  it("toggles selected user on click", async () => {
    const { wrapper, getSelected } = await mountUserNav([
      { name: "alice@example.com", score: 2, leader: true },
      { name: "bob@example.com", score: 1, leader: false },
    ]);

    const firstButton = wrapper.findAll("button.user-button")[0];
    await firstButton.trigger("click");
    expect(getSelected()).toBe("alice@example.com");

    await firstButton.trigger("click");
    expect(getSelected()).toBe(null);
  });
});

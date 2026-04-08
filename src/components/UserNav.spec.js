import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { toPublicUserLabel } from "@/helpers";

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

const userInitialStub = {
  props: ["user", "score", "leader", "colorKey", "initialLabel"],
  template: "<div class='user-initial' :data-user='user' :data-color-key='colorKey' :data-initial-label='initialLabel'><slot /></div>",
};

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
        UserInitial: userInitialStub,
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

  it("does not render user nav with a single user by default", async () => {
    const { wrapper } = await mountUserNav([
      { name: "user@example.com", score: 1, leader: true },
    ]);

    expect(wrapper.find("nav.user-nav").exists()).toBe(false);
  });

  it("renders user nav with a single user when showForSingle is enabled", async () => {
    const UserNav = (await import("./UserNav.vue")).default;
    const wrapper = mount(UserNav, {
      props: {
        users: [{ name: "user@example.com", score: 1, leader: true }],
        showForSingle: true,
        selectedUser: null,
        "onUpdate:selectedUser": () => {},
      },
      global: {
        stubs: {
          UserInitial: userInitialStub,
          TransitionGroup: {
            template: "<div><slot /></div>",
          },
        },
      },
    });

    expect(wrapper.find("nav.user-nav").exists()).toBe(true);
    expect(wrapper.findAll("button.user-button")).toHaveLength(1);
  });

  it("marks current user via email alias", async () => {
    const UserNav = (await import("./UserNav.vue")).default;
    const wrapper = mount(UserNav, {
      props: {
        users: [{ name: "user@example.com", score: 1, leader: true }],
        showForSingle: true,
        selectedUser: null,
        "onUpdate:selectedUser": () => {},
      },
      global: {
        stubs: {
          UserInitial: userInitialStub,
          TransitionGroup: {
            template: "<div><slot /></div>",
          },
        },
      },
    });

    expect(wrapper.find(".me").exists()).toBe(true);
  });

  it("masks raw email when no friendly alias exists but keeps color keyed by raw identity", async () => {
    getFriendlyNameMock.mockImplementationOnce((name) => name);

    const UserNav = (await import("./UserNav.vue")).default;
    const wrapper = mount(UserNav, {
      props: {
        users: [{ name: "stranger@example.com", score: 1, leader: true }],
        showForSingle: true,
        selectedUser: null,
        "onUpdate:selectedUser": () => {},
      },
      global: {
        stubs: {
          UserInitial: userInitialStub,
          TransitionGroup: {
            template: "<div><slot /></div>",
          },
        },
      },
    });

    expect(wrapper.text()).toContain(toPublicUserLabel("stranger@example.com"));
    expect(wrapper.text()).not.toContain("stranger@example.com");
    expect(wrapper.find(".user-initial").attributes("data-color-key")).toBe("stranger@example.com");
    expect(wrapper.find(".user-initial").attributes("data-initial-label")).toBe(toPublicUserLabel("stranger@example.com"));
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

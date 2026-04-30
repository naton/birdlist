import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";

const shareModalSpy = vi.fn();

vi.mock("@/stores/settings.js", async () => {
  const { defineStore } = await import("pinia");
  const useSettingsStore = defineStore("settings", () => ({
    t: (key) => key,
  }));
  return { useSettingsStore };
});

describe("ListActionsMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  async function mountMenu(props = {}) {
    const ListActionsMenu = (await import("./ListActionsMenu.vue")).default;
    return mount(ListActionsMenu, {
      props: {
        list: { id: "list-1", type: "normal" },
        isListOwner: true,
        isPublicCurrentList: false,
        canWriteToCurrentList: true,
        canJoinCurrentList: false,
        canLeaveCurrentList: false,
        mustLoginToJoin: false,
        isPremiumUser: true,
        isSubscribedToNotifications: false,
        isNotificationToggleBusy: false,
        canEditBirds: false,
        isEditingBirds: false,
        canMakeChecklist: true,
        isUpdatingVisibility: false,
        ...props,
      },
      global: {
        stubs: {
          ShareDialog: defineComponent({
            name: "ShareDialog",
            setup(_props, { expose }) {
              expose({
                showModal: shareModalSpy,
              });
              return () => h("div");
            },
          }),
        },
      },
    });
  }

  it("shows owner actions and emits action events", async () => {
    const wrapper = await mountMenu();
    expect(wrapper.find("[data-action='open-menu']").classes()).toContain("list-actions-anchor");
    expect(wrapper.find(".list-actions-popover").attributes("popover")).toBe("auto");

    const ownerActionSelectors = [
      "[data-action='share']",
      "[data-action='copy-link']",
      "[data-action='subscribe']",
      "[data-action='edit-list']",
      "[data-action='make-checklist']",
      "[data-action='toggle-visibility']",
      "[data-action='delete']",
    ];

    ownerActionSelectors.forEach((selector) => {
      expect(wrapper.find(`${selector} .option-icon`).exists()).toBe(true);
    });

    await wrapper.find("[data-action='share']").trigger("click");
    expect(shareModalSpy).toHaveBeenCalledTimes(1);

    await wrapper.find("[data-action='copy-link']").trigger("click");
    await wrapper.find("[data-action='subscribe']").trigger("click");
    await wrapper.find("[data-action='edit-list']").trigger("click");
    await wrapper.find("[data-action='make-checklist']").trigger("click");
    await wrapper.find("[data-action='toggle-visibility']").trigger("click");
    await wrapper.find("[data-action='delete']").trigger("click");

    expect(wrapper.emitted("copy-link")).toHaveLength(1);
    expect(wrapper.emitted("toggle-notifications")).toHaveLength(1);
    expect(wrapper.emitted("edit-list")).toHaveLength(1);
    expect(wrapper.emitted("make-checklist")).toHaveLength(1);
    expect(wrapper.emitted("toggle-visibility")).toHaveLength(1);
    expect(wrapper.emitted("delete-list")).toHaveLength(1);
  });

  it("shows join/login actions for public non-member flow", async () => {
    const wrapper = await mountMenu({
      isListOwner: false,
      isPublicCurrentList: true,
      canWriteToCurrentList: false,
      canJoinCurrentList: true,
      mustLoginToJoin: false,
      isPremiumUser: false,
      canMakeChecklist: false,
    });

    expect(wrapper.find("[data-action='join']").exists()).toBe(true);
    await wrapper.find("[data-action='join']").trigger("click");
    expect(wrapper.emitted("join")).toHaveLength(1);
  });

  it("shows subscribe, copy link, and leave for joined public non-owners", async () => {
    const wrapper = await mountMenu({
      isListOwner: false,
      isPublicCurrentList: true,
      canWriteToCurrentList: true,
      canJoinCurrentList: false,
      canLeaveCurrentList: true,
      mustLoginToJoin: false,
      isPremiumUser: false,
      canMakeChecklist: false,
    });

    expect(wrapper.find("[data-action='share']").exists()).toBe(false);
    expect(wrapper.find("[data-action='copy-link']").exists()).toBe(true);
    expect(wrapper.find("[data-action='subscribe']").exists()).toBe(true);
    expect(wrapper.find("[data-action='leave']").exists()).toBe(true);

    await wrapper.find("[data-action='copy-link']").trigger("click");
    await wrapper.find("[data-action='subscribe']").trigger("click");
    await wrapper.find("[data-action='leave']").trigger("click");

    expect(wrapper.emitted("copy-link")).toHaveLength(1);
    expect(wrapper.emitted("toggle-notifications")).toHaveLength(1);
    expect(wrapper.emitted("leave")).toHaveLength(1);
  });

  it("supports legacy isEditingBirds prop without changing edit action label", async () => {
    const wrapper = await mountMenu({
      canEditBirds: true,
      isEditingBirds: true,
    });

    const editBirdsButton = wrapper.find("[data-action='toggle-edit-birds']");
    expect(editBirdsButton.exists()).toBe(true);
    expect(editBirdsButton.text()).toContain("Edit_Birds");
  });
});

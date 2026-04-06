import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";

const showModalSpy = vi.fn();
const openModalSpy = vi.fn();

const currentListRef = ref({
  id: "list-1",
  title: "My List",
  description: "",
  owner: "user@example.com",
});
const currentListExpandedRef = ref(true);
const isUserLoggedInRef = ref(true);

function mockStores() {
  vi.doMock("@/stores/settings.js", async () => {
    const { defineStore } = await import("pinia");
    const useSettingsStore = defineStore("settings", () => ({
      isUserLoggedIn: isUserLoggedInRef,
      t: (key) => key,
    }));
    return { useSettingsStore };
  });

  vi.doMock("@/stores/lists.js", async () => {
    const { defineStore } = await import("pinia");
    const useListsStore = defineStore("list", () => ({
      isOwnedByCurrentUser: () => true,
      currentList: currentListRef,
      currentListExpanded: currentListExpandedRef,
    }));
    return { useListsStore };
  });

  vi.doMock("@/stores/friends.js", async () => {
    const { defineStore } = await import("pinia");
    const useFriendsStore = defineStore("friend", () => ({
      getFriendlyName: (name) => name,
    }));
    return { useFriendsStore };
  });
}

async function mountListInfoWithDialogExpose(methods) {
  vi.resetModules();
  mockStores();

  vi.doMock("./ShareDialog.vue", async () => {
    const { defineComponent, h } = await import("vue");
    return {
      default: defineComponent({
        name: "ShareDialog",
        setup(_props, { expose }) {
          expose(methods);
          return () => h("div");
        },
      }),
    };
  });

  const ListInfo = (await import("./ListInfo.vue")).default;
  return mount(ListInfo, {
    slots: { extra: "<div />" },
  });
}

describe("ListInfo share dialog hook-up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it("calls showModal when share button is clicked", async () => {
    const wrapper = await mountListInfoWithDialogExpose({ showModal: showModalSpy });

    await wrapper.find("button.share-button").trigger("click");
    expect(showModalSpy).toHaveBeenCalledTimes(1);
  });

  it("falls back to openModal when showModal is not exposed", async () => {
    const wrapper = await mountListInfoWithDialogExpose({ openModal: openModalSpy });

    await wrapper.find("button.share-button").trigger("click");
    expect(openModalSpy).toHaveBeenCalledTimes(1);
  });
});

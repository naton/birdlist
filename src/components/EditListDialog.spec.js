import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";

const updateListMock = vi.fn();
const addMessageMock = vi.fn();

vi.mock("../stores/settings.js", async () => {
  const { defineStore } = await import("pinia");
  const useSettingsStore = defineStore("settings", () => ({
    t: (key) => key,
  }));
  return { useSettingsStore };
});

vi.mock("../stores/lists.js", async () => {
  const { defineStore } = await import("pinia");
  const useListsStore = defineStore("list", () => ({
    updateList: updateListMock,
    deleteList: vi.fn(),
    isOwnedByCurrentUser: () => true,
    setListPublicVisibility: vi.fn(),
  }));
  return { useListsStore };
});

vi.mock("../stores/messages.js", async () => {
  const { defineStore } = await import("pinia");
  const useMessagesStore = defineStore("messages", () => ({
    addMessage: addMessageMock,
  }));
  return { useMessagesStore };
});

describe("EditListDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    updateListMock.mockResolvedValue(undefined);
  });

  it("saves list edits and closes after the save completes", async () => {
    const EditListDialog = (await import("./EditListDialog.vue")).default;
    const list = {
      id: "list-1",
      title: "Old title",
      description: "Old description",
      type: "normal",
      realmId: "user-1",
      owner: "user-1",
    };

    const wrapper = mount(EditListDialog, {
      props: {
        modelValue: true,
        list,
      },
      global: {
        stubs: {
          AppDialog: defineComponent({
            name: "AppDialog",
            props: ["modelValue"],
            emits: ["update:modelValue"],
            setup(props, { slots }) {
              return () => props.modelValue ? h("div", { "data-testid": "dialog" }, slots.default?.()) : null;
            },
          }),
          ListsIcon: true,
          DeleteIcon: true,
        },
      },
    });

    await nextTick();
    await wrapper.find("#list-title").setValue("New title");
    await wrapper.find("#list-description").setValue("New description");
    await wrapper.find(".update-button").trigger("click");
    await nextTick();

    expect(updateListMock).toHaveBeenCalledWith(expect.objectContaining({
      id: "list-1",
      title: "New title",
      description: "New description",
    }));
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
    expect(list.title).toBe("New title");
    expect(list.description).toBe("New description");
  });
});

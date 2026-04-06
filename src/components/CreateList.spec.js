import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";

const appDialogProps = [];

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

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
    createList: vi.fn().mockResolvedValue("list-1"),
  }));
  return { useListsStore };
});

describe("CreateList anchor propagation", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    appDialogProps.length = 0;
  });

  it("marks opener as anchor and passes anchored class to AppDialog", async () => {
    const CreateList = (await import("./CreateList.vue")).default;

    const wrapper = mount(CreateList, {
      global: {
        stubs: {
          AppDialog: defineComponent({
            name: "AppDialog",
            props: ["modelValue", "dialogClass"],
            setup(props, { slots }) {
              appDialogProps.push(props);
              return () => h("div", { "data-testid": "app-dialog" }, slots.default?.());
            },
          }),
          ListFormFields: true,
          ListsIcon: true,
        },
      },
    });

    const anchorTarget = document.createElement("button");

    wrapper.vm.showModal(anchorTarget);
    await wrapper.vm.$nextTick();

    const lastProps = appDialogProps[appDialogProps.length - 1];
    expect(lastProps.dialogClass).toBe("dialog--create-list-anchored");
    expect(anchorTarget.classList.contains("create-list-anchor")).toBe(true);

    wrapper.vm.close();
    await wrapper.vm.$nextTick();
    expect(anchorTarget.classList.contains("create-list-anchor")).toBe(false);
  });
});

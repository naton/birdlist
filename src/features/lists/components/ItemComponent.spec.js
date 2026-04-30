import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";

const langRef = ref("en");

vi.mock("@/stores/settings.js", async () => {
  const { defineStore } = await import("pinia");
  const useSettingsStore = defineStore("settings", () => ({
    lang: langRef,
  }));
  return { useSettingsStore };
});

const userInitialStub = {
  props: ["user", "initialLabel", "colorKey"],
  template: "<span class='user-initial' :data-user='user' />",
};

const locationSpecifiedIconStub = {
  template: "<span class='location-icon' />",
};

function createObservation(overrides = {}) {
  return {
    id: overrides.id || "obs-1",
    owner: overrides.owner || "alice@example.com",
    date: overrides.date || new Date("2024-01-01"),
    name: overrides.name || "Mallard",
    ...overrides,
  };
}

async function mountItem(props = {}) {
  const ItemComponent = (await import("./ItemComponent.vue")).default;
  let selected = props.modelValue ?? null;

  const wrapper = mount(ItemComponent, {
    props: {
      obs: createObservation(),
      ...props,
      modelValue: selected,
      "onUpdate:modelValue": async (value) => {
        selected = value;
        await wrapper.setProps({ modelValue: value });
      },
    },
    global: {
      stubs: {
        UserInitial: userInitialStub,
        LocationSpecifiedIcon: locationSpecifiedIconStub,
      },
    },
  });

  return { wrapper, getSelected: () => selected };
}

describe("ItemComponent", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    langRef.value = "en";
  });

  it("emits and selects the observation in observation mode", async () => {
    const observation = createObservation({ id: "obs-a" });
    const { wrapper, getSelected } = await mountItem({ obs: observation });

    await wrapper.find("li").trigger("click");

    expect(wrapper.emitted("edit")).toEqual([[observation]]);
    expect(getSelected()).toStrictEqual(observation);
  });

  it("emits and selects the latest observation in species mode", async () => {
    const firstObservation = createObservation({ id: "obs-a", date: new Date("2024-01-01") });
    const lastObservation = createObservation({ id: "obs-b", date: new Date("2024-01-03") });
    const { wrapper, getSelected } = await mountItem({
      mode: "species",
      obs: [firstObservation, lastObservation],
    });

    await wrapper.find("li").trigger("click");

    expect(wrapper.emitted("edit")).toEqual([[lastObservation]]);
    expect(getSelected()).toStrictEqual(lastObservation);
  });

  it("renders one owner badge per distinct owner in species mode", async () => {
    const { wrapper } = await mountItem({
      mode: "species",
      obs: [
        createObservation({ id: "obs-a", owner: "alice@example.com" }),
        createObservation({ id: "obs-b", owner: "alice@example.com" }),
        createObservation({ id: "obs-c", owner: "bob@example.com" }),
      ],
    });

    expect(wrapper.findAll(".user-initial")).toHaveLength(2);
  });
});

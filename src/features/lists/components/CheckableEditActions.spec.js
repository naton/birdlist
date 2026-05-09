import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";

const checkListEditMode = ref(true);
const birdsToCheck = ref(["Crow", "Mallard", "Robin"]);
const checkListBirds = ref([
  { name: "Crow", checked: false },
  { name: "Mallard", checked: false },
  { name: "Robin", checked: false },
]);
const addAllBirdsFromRegion = vi.fn();
const saveCheckList = vi.fn();

vi.mock("@/composables/useCheckableList", () => ({
  useCheckableList: () => ({
    t: (key) => key,
    addMessage: vi.fn(),
    birds: ref([{ name: "Crow" }]),
    selectedUser: ref(null),
    checkListEditMode,
    currentLeader: ref(""),
    birdsToCheck,
    addListBirdInput: ref(null),
    checkListBirds,
    users: ref([]),
    addListBird: vi.fn(),
    addAllBirdsFromRegion,
    checkBird: vi.fn(),
    removeBird: vi.fn(),
    saveCheckList,
    initializeBirdsFromList: vi.fn(),
  }),
}));

const globalStubs = {
  UserNav: defineComponent({ render: () => h("div") }),
  BirdItem: defineComponent({ render: () => h("div") }),
  BingoItem: defineComponent({ render: () => h("div") }),
  SvgChart: defineComponent({ render: () => h("div", { "data-testid": "svg-chart" }) }),
  "vue3-simple-typeahead": defineComponent({ render: () => h("div") }),
  TransitionGroup: defineComponent({ render: () => h("div") }),
};

describe("Inline edit actions", () => {
  beforeEach(() => {
    checkListEditMode.value = true;
    addAllBirdsFromRegion.mockReset();
    saveCheckList.mockReset();
  });

  it("shows cancel beside save in checklist and closes edit mode", async () => {
    const CheckList = (await import("@/features/lists/components/CheckList.vue")).default;
    const wrapper = mount(CheckList, {
      props: {
        list: { id: "list-1", type: "checklist", birds: ["Crow"] },
        comments: [],
        observations: [],
        readOnly: false,
      },
      global: { stubs: globalStubs },
    });

    expect(wrapper.find("[data-action='save-birds']").exists()).toBe(true);
    expect(wrapper.find("[data-action='add-region-birds']").exists()).toBe(true);
    expect(wrapper.find("[data-action='cancel-edit-birds']").exists()).toBe(true);

    await wrapper.find("[data-action='cancel-edit-birds']").trigger("click");
    await nextTick();
    expect(checkListEditMode.value).toBe(false);
  });

  it("renders an inline edit button when checklist is in checking mode", async () => {
    checkListEditMode.value = false;
    const CheckList = (await import("@/features/lists/components/CheckList.vue")).default;
    const wrapper = mount(CheckList, {
      props: {
        list: { id: "list-1", type: "checklist", birds: ["Crow"] },
        comments: [],
        observations: [],
        readOnly: false,
      },
      global: { stubs: globalStubs },
    });

    expect(wrapper.find("[data-action='edit-birds-inline']").exists()).toBe(true);

    await wrapper.find("[data-action='edit-birds-inline']").trigger("click");
    await nextTick();
    expect(checkListEditMode.value).toBe(true);
  });

  it("bulk-adds birds from the current region", async () => {
    const CheckList = (await import("@/features/lists/components/CheckList.vue")).default;
    const wrapper = mount(CheckList, {
      props: {
        list: { id: "list-1", type: "checklist", birds: ["Crow"] },
        comments: [],
        observations: [],
        readOnly: false,
      },
      global: { stubs: globalStubs },
    });

    await wrapper.find("[data-action='add-region-birds']").trigger("click");

    expect(addAllBirdsFromRegion).toHaveBeenCalledTimes(1);
  });

  it("does not render SvgChart in checklist", async () => {
    const CheckList = (await import("@/features/lists/components/CheckList.vue")).default;
    const wrapper = mount(CheckList, {
      props: {
        list: { id: "list-1", type: "checklist", birds: ["Crow"] },
        comments: [],
        observations: [],
        readOnly: false,
      },
      global: { stubs: globalStubs },
    });

    expect(wrapper.find("[data-testid='svg-chart']").exists()).toBe(false);
  });

  it("does not warn for onNewLeader listener on checklist", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const CheckList = (await import("@/features/lists/components/CheckList.vue")).default;
    mount(CheckList, {
      props: {
        list: { id: "list-1", type: "checklist", birds: ["Crow"] },
        comments: [],
        observations: [],
        readOnly: false,
        onNewLeader: vi.fn(),
      },
      global: { stubs: globalStubs },
    });

    const extraneousListenerWarnings = warnSpy.mock.calls
      .flat()
      .map((value) => String(value))
      .filter((msg) => msg.includes("Extraneous non-emits event listeners"));
    expect(extraneousListenerWarnings).toHaveLength(0);
    warnSpy.mockRestore();
  });

  it("shows cancel beside save in bingo and closes edit mode", async () => {
    const BingoList = (await import("@/features/lists/components/BingoList.vue")).default;
    const wrapper = mount(BingoList, {
      props: {
        list: { id: "list-2", type: "bingo", birds: ["Crow", "Mallard", "Robin"], bingoSize: 3 },
        comments: [],
        observations: [],
        readOnly: false,
      },
      global: { stubs: globalStubs },
    });

    expect(wrapper.find("[data-action='save-birds']").exists()).toBe(true);
    expect(wrapper.find("[data-action='cancel-edit-birds']").exists()).toBe(true);

    await wrapper.find("[data-action='cancel-edit-birds']").trigger("click");
    await nextTick();
    expect(checkListEditMode.value).toBe(false);
  });
});

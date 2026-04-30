import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

vi.mock("@/components/BirdstreakList.vue", () => ({
  default: {
    name: "BirdstreakList",
    props: ["list", "observations", "comments", "participants", "readOnly"],
    template: "<div data-testid='birdstreak' :data-read-only='readOnly'>{{ list.type }}</div>",
  },
}));

vi.mock("@/components/CheckList.vue", () => ({
  default: {
    name: "CheckList",
    props: ["list", "observations", "comments", "participants", "readOnly"],
    template: "<div data-testid='checklist' :data-read-only='readOnly'>{{ list.type }}</div>",
  },
}));

vi.mock("@/components/BingoList.vue", () => ({
  default: {
    name: "BingoList",
    props: ["list", "observations", "comments", "participants", "readOnly"],
    emits: ["edit", "newLeader"],
    template: `
      <div data-testid="bingo" :data-read-only="readOnly">
        <button data-testid="edit" @click="$emit('edit', observations[0])">edit</button>
        <button data-testid="leader" @click="$emit('newLeader')">leader</button>
      </div>
    `,
  },
}));

vi.mock("@/components/NormalList.vue", () => ({
  default: {
    name: "NormalList",
    props: ["list", "observations", "comments", "participants", "readOnly"],
    template: "<div data-testid='normal' :data-participants='participants.length'>{{ list.type }}</div>",
  },
}));

describe("ListRenderer", () => {
  it("renders the component matching the list type", async () => {
    const ListRenderer = (await import("./ListRenderer.vue")).default;
    const wrapper = mount(ListRenderer, {
      props: {
        list: { id: "list-1", type: "checklist" },
        observations: [],
        comments: [],
        readOnly: true,
      },
    });

    expect(wrapper.find("[data-testid='checklist']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='checklist']").attributes("data-read-only")).toBe("true");
  });

  it("falls back to the normal list renderer for unknown list types", async () => {
    const ListRenderer = (await import("./ListRenderer.vue")).default;
    const wrapper = mount(ListRenderer, {
      props: {
        list: { id: "list-2", type: "unexpected" },
        participants: ["owner@example.com"],
      },
    });

    expect(wrapper.find("[data-testid='normal']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='normal']").attributes("data-participants")).toBe("1");
  });

  it("forwards renderer events to the parent boundary", async () => {
    const observation = { id: "obs-1" };
    const ListRenderer = (await import("./ListRenderer.vue")).default;
    const wrapper = mount(ListRenderer, {
      props: {
        list: { id: "list-3", type: "bingo", bingoSize: 3 },
        observations: [observation],
      },
    });

    await wrapper.find("[data-testid='edit']").trigger("click");
    await wrapper.find("[data-testid='leader']").trigger("click");

    expect(wrapper.emitted("edit")).toEqual([[observation]]);
    expect(wrapper.emitted("newLeader")).toHaveLength(1);
  });
});

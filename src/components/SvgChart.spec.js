import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";

const currentUserRef = ref({
  name: "alice@example.com",
});

vi.mock("@/stores/settings.js", async () => {
  const { defineStore } = await import("pinia");
  const useSettingsStore = defineStore("settings", () => ({
    currentUser: currentUserRef,
    selectedUser: ref(null),
  }));
  return { useSettingsStore };
});

const svgChartLineStub = {
  props: ["d"],
  template: "<g class='svg-chart-line' :data-user='d.name' />",
};

function createObservation(owner, date) {
  return {
    owner,
    date: new Date(date),
  };
}

async function mountChart(props = {}) {
  const SvgChart = (await import("./SvgChart.vue")).default;

  return mount(SvgChart, {
    props: {
      observations: [
        createObservation("alice@example.com", "2024-01-01"),
        createObservation("bob@example.com", "2024-01-02"),
      ],
      users: [
        { name: "alice@example.com", score: 2, leader: true },
        { name: "bob@example.com", score: 1, leader: false },
      ],
      currentLeader: "bob@example.com",
      ...props,
    },
    attachTo: document.body,
    global: {
      stubs: {
        SvgChartLine: svgChartLineStub,
      },
    },
  });
}

describe("SvgChart", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    currentUserRef.value = {
      name: "alice@example.com",
    };
  });

  it("renders one dataset per user", async () => {
    const wrapper = await mountChart();

    expect(wrapper.findAll(".svg-chart-line")).toHaveLength(2);
  });

  it("does not emit newLeader on initial mount", async () => {
    const wrapper = await mountChart({
      currentLeader: "alice@example.com",
    });

    expect(wrapper.emitted("newLeader")).toBeFalsy();
  });

  it("emits newLeader when current user takes the lead after mount", async () => {
    const wrapper = await mountChart();

    await wrapper.setProps({
      currentLeader: "alice@example.com",
      users: [
        { name: "alice@example.com", score: 3, leader: true },
        { name: "bob@example.com", score: 1, leader: false },
      ],
    });

    expect(wrapper.emitted("newLeader")).toHaveLength(1);
  });
});

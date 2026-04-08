import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

describe("UserInitial", () => {
  it("uses the raw email identifier for the initial even when the visible label is masked", async () => {
    const UserInitial = (await import("./UserInitial.vue")).default;
    const wrapper = mount(UserInitial, {
      props: {
        user: "anton@example.com",
        initialLabel: "Birder DFC3",
        colorKey: "anton@example.com",
      },
    });

    expect(wrapper.find(".initial").text()).toBe("a");
  });

  it("uses the visible label initial for non-email users", async () => {
    const UserInitial = (await import("./UserInitial.vue")).default;
    const wrapper = mount(UserInitial, {
      props: {
        user: "user-1",
        initialLabel: "Anton",
        colorKey: "user-1",
      },
    });

    expect(wrapper.find(".initial").text()).toBe("A");
  });
});

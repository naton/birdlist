import { beforeAll, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
    };
  }
});

describe("AppDialog", () => {
  it("applies provided dialogClass on rendered dialog", async () => {
    const AppDialog = (await import("./AppDialog.vue")).default;
    const wrapper = mount(AppDialog, {
      props: {
        modelValue: true,
        dialogClass: "dialog--create-list-anchored",
      },
      slots: {
        header: "<h1>title</h1>",
        default: "<div>hello</div>",
        footer: "<button>done</button>",
      },
    });

    const dialog = wrapper.find("dialog");
    expect(dialog.exists()).toBe(true);
    expect(dialog.classes()).toContain("dialog--create-list-anchored");
    expect(wrapper.find("header").exists()).toBe(true);
    expect(wrapper.find("footer").exists()).toBe(true);
  });

  it("prevents native cancel so Vue leave transition can run", async () => {
    const AppDialog = (await import("./AppDialog.vue")).default;
    const wrapper = mount(AppDialog, {
      props: {
        modelValue: true,
      },
      slots: {
        default: "<div>hello</div>",
      },
    });

    const event = new Event("cancel", { cancelable: true });
    wrapper.find("dialog").element.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
  });

  it("can keep backdrop clicks open when disabled", async () => {
    const AppDialog = (await import("./AppDialog.vue")).default;
    const wrapper = mount(AppDialog, {
      props: {
        modelValue: true,
        closeOnBackdrop: false,
      },
      slots: {
        default: "<div>hello</div>",
      },
    });

    await wrapper.find("dialog").trigger("click");

    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });
});

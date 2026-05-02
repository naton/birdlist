import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";

function createContext() {
  const state = {
    comments: [],
  };

  return {
    state,
    db: {
      cloud: {
        sync: vi.fn().mockResolvedValue(undefined),
      },
      comments: {
        async toArray() {
          return [...state.comments];
        },
        async add(row) {
          state.comments.push({ ...row, id: row.id || "com-1" });
        },
      },
    },
    currentUserRef: ref({
      userId: "user-1",
      email: "user@example.com",
      name: "User One",
    }),
    currentListRef: ref({
      id: "list-1",
      realmId: "realm-list-1",
    }),
    addMessageSpy: vi.fn(),
    savePublicCommentSpy: vi.fn().mockResolvedValue({ success: true }),
  };
}

async function loadStore(ctx) {
  vi.resetModules();
  vi.doMock("dexie", () => ({
    liveQuery: (queryFn) => ({
      subscribe: (next, error) => {
        Promise.resolve(queryFn()).then(next).catch(error);
        return { unsubscribe: vi.fn() };
      },
    }),
  }));
  vi.doMock("../db", () => ({ db: ctx.db }));
  vi.doMock("@/helpers", () => ({
    savePublicComment: (...args) => ctx.savePublicCommentSpy(...args),
  }));
  vi.doMock("./messages.js", async () => {
    const { defineStore } = await import("pinia");
    const useMessagesStore = defineStore("messages", () => ({
      addMessage: ctx.addMessageSpy,
    }));
    return { useMessagesStore };
  });
  vi.doMock("./settings.js", async () => {
    const { defineStore } = await import("pinia");
    const useSettingsStore = defineStore("settings", () => ({
      currentUser: ctx.currentUserRef,
      t: (key) => key,
    }));
    return { useSettingsStore };
  });
  vi.doMock("./lists.js", async () => {
    const { defineStore } = await import("pinia");
    const useListsStore = defineStore("lists", () => ({
      currentList: ctx.currentListRef,
      isPublicList: (list) => list?.realmId === "rlm-public",
    }));
    return { useListsStore };
  });

  const mod = await import("./comments.js");
  return mod.useCommentsStore;
}

describe("comments store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it("stores private list comments in the list realm", async () => {
    const ctx = createContext();
    const useCommentsStore = await loadStore(ctx);
    const store = useCommentsStore();

    await expect(store.addComment({ listId: "list-1", comment: "Nice", user: "User One" })).resolves.toBe(true);

    expect(ctx.state.comments).toEqual([
      expect.objectContaining({
        comment: "Nice",
        owner: "User One",
        userId: "User One",
        realmId: "realm-list-1",
        listId: "list-1",
      }),
    ]);
    expect(ctx.savePublicCommentSpy).not.toHaveBeenCalled();
  });

  it("saves public list comments through the trusted API", async () => {
    const ctx = createContext();
    ctx.currentListRef.value = {
      id: "public-1",
      realmId: "rlm-public",
    };
    const useCommentsStore = await loadStore(ctx);
    const store = useCommentsStore();

    await expect(store.addComment({ listId: "public-1", comment: "Hello", user: "User One" })).resolves.toBe(true);

    expect(ctx.state.comments).toEqual([]);
    expect(ctx.savePublicCommentSpy).toHaveBeenCalledWith(expect.objectContaining({
      comment: "Hello",
      owner: "User One",
      userId: "User One",
      realmId: "rlm-public",
      listId: "public-1",
      ownerAliases: expect.arrayContaining(["user-1", "user@example.com", "User One"]),
    }));
    expect(ctx.db.cloud.sync).toHaveBeenCalledWith({ wait: true });
  });

  it("reports public comment save failures", async () => {
    const ctx = createContext();
    ctx.currentListRef.value = {
      id: "public-1",
      realmId: "rlm-public",
    };
    ctx.savePublicCommentSpy.mockResolvedValue({ success: false, message: "Nope" });
    const useCommentsStore = await loadStore(ctx);
    const store = useCommentsStore();

    await expect(store.addComment({ listId: "public-1", comment: "Hello", user: "User One" })).resolves.toBe(false);

    expect(ctx.addMessageSpy).toHaveBeenCalledWith("Nope");
    expect(ctx.db.cloud.sync).not.toHaveBeenCalled();
  });
});

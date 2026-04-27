import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { createPinia, setActivePinia } from "pinia";

function createMockContext() {
  const state = {
    lists: [],
    observations: [],
    comments: [],
    joinedLists: [],
    members: [],
    realms: [],
  };

  let idCounter = 1;

  function matchesQuery(row, query) {
    return Object.entries(query).every(([key, value]) => row[key] === value);
  }

  function whereApi(tableName, query) {
    return {
      async toArray() {
        return state[tableName].filter((row) => matchesQuery(row, query));
      },
      async first() {
        return state[tableName].find((row) => matchesQuery(row, query));
      },
      async delete() {
        state[tableName] = state[tableName].filter((row) => !matchesQuery(row, query));
      },
      async modify(changes) {
        state[tableName] = state[tableName].map((row) =>
          matchesQuery(row, query) ? { ...row, ...changes } : row
        );
      },
    };
  }

  const db = {
    cloud: { login: vi.fn(), sync: vi.fn().mockResolvedValue(undefined) },
    async transaction(_mode, _tables, fn) {
      return await fn();
    },
    lists: {
      async toArray() {
        return [...state.lists];
      },
      async add(payload) {
        const id = payload.id || `lst-${idCounter++}`;
        state.lists.push({ ...payload, id });
        return id;
      },
      async update(id, changes) {
        const row = state.lists.find((item) => item.id === id);
        if (!row) return 0;
        Object.assign(row, changes);
        return 1;
      },
      async delete(id) {
        state.lists = state.lists.filter((row) => row.id !== id);
      },
      where(query) {
        return whereApi("lists", query);
      },
    },
    observations: {
      where(query) {
        return whereApi("observations", query);
      },
    },
    comments: {
      where(query) {
        return whereApi("comments", query);
      },
    },
    joinedLists: {
      where(query) {
        if (query === "[userId+listId]") {
          return {
            equals([userId, listId]) {
              const rows = state.joinedLists.filter(
                (row) => row.userId === userId && row.listId === listId
              );
              return {
                async first() {
                  return rows[0];
                },
                async toArray() {
                  return [...rows];
                },
              };
            },
          };
        }
        return whereApi("joinedLists", query);
      },
      async add(payload) {
        const id = payload.id || `jn-${idCounter++}`;
        state.joinedLists.push({ ...payload, id });
        return id;
      },
      async update(id, changes) {
        const row = state.joinedLists.find((item) => item.id === id);
        if (!row) return 0;
        Object.assign(row, changes);
        return 1;
      },
      async bulkDelete(ids) {
        const idSet = new Set(ids);
        state.joinedLists = state.joinedLists.filter((row) => !idSet.has(row.id));
      },
    },
    members: {
      where(query) {
        return whereApi("members", query);
      },
      async bulkAdd(rows) {
        state.members.push(...rows);
      },
    },
    realms: {
      async put(row) {
        state.realms.push(row);
      },
      async delete(realmId) {
        state.realms = state.realms.filter((row) => row.realmId !== realmId);
      },
    },
  };

  return {
    state,
    db,
    route: { params: { id: "" } },
    pushSpy: vi.fn(),
    deleteListRemotelySpy: vi.fn(),
    setListVisibilitySpy: vi.fn(),
    addMessageSpy: vi.fn(),
    currentUserRef: ref({
      userId: "user-1",
      name: "User One",
      email: "user@example.com",
    }),
  };
}

function seedLists(ctx) {
  ctx.state.lists = [
    {
      id: "private-1",
      title: "Private",
      owner: "owner-1",
      realmId: "owner-1",
      updated: new Date("2026-01-01"),
    },
    {
      id: "public-1",
      title: "Public",
      owner: "owner-2",
      realmId: "rlm-public",
      updated: new Date("2026-01-02"),
    },
  ];
}

async function loadStoreWithMocks(ctx) {
  vi.resetModules();
  vi.doMock("vue-router", () => ({
    useRoute: () => ctx.route,
    useRouter: () => ({ push: ctx.pushSpy }),
  }));
  vi.doMock("dexie", () => ({
    liveQuery: (queryFn) => ({
      subscribe: (next, error) => {
        Promise.resolve(queryFn()).then(next).catch(error);
        return { unsubscribe: vi.fn() };
      },
    }),
  }));
  vi.doMock("dexie-cloud-addon", () => ({
    getTiedRealmId: (listId) => `realm-${listId}`,
  }));
  vi.doMock("../helpers", () => ({
    deleteListRemotely: (...args) => ctx.deleteListRemotelySpy(...args),
    setListVisibility: (...args) => ctx.setListVisibilitySpy(...args),
  }));
  vi.doMock("../db", () => ({ db: ctx.db }));
  vi.doMock("./messages", async () => {
    const { defineStore } = await import("pinia");
    const useMessagesStore = defineStore("messages", () => ({
      addMessage: ctx.addMessageSpy,
    }));
    return { useMessagesStore };
  });
  vi.doMock("./settings", async () => {
    const { defineStore } = await import("pinia");
    const useSettingsStore = defineStore("settings", () => ({
      currentUser: ctx.currentUserRef,
      isUserLoggedIn: computed(() => ctx.currentUserRef.value?.userId !== "unauthorized"),
      t: (key) => key,
    }));
    return { useSettingsStore };
  });

  const mod = await import("./lists.js");
  return mod.useListsStore;
}

async function flushLiveQuery() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("lists store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it("allows writing to private lists for any user", async () => {
    const ctx = createMockContext();
    seedLists(ctx);
    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    expect(store.canWriteToList(ctx.state.lists[0])).toBe(true);
  });

  it("requires join before writing to public lists", async () => {
    const ctx = createMockContext();
    seedLists(ctx);
    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    expect(store.canWriteToList(ctx.state.lists[1])).toBe(false);
    await expect(store.joinPublicList("public-1")).resolves.toBe(true);
    expect(store.joinedListIds).toContain("public-1");
    expect(store.canWriteToList(ctx.state.lists[1])).toBe(true);
  });

  it("blocks join when user is unauthorized", async () => {
    const ctx = createMockContext();
    seedLists(ctx);
    ctx.currentUserRef.value = {
      userId: "unauthorized",
      name: "Guest",
      email: "",
    };

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await expect(store.joinPublicList("public-1")).resolves.toBe(false);
    expect(store.joinedListIds).toEqual([]);
    expect(ctx.addMessageSpy).toHaveBeenCalledWith("You_Need_To_Login_First");
  });

  it("removes join and write access when leaving a public list", async () => {
    const ctx = createMockContext();
    seedLists(ctx);
    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await store.joinPublicList("public-1");
    await expect(store.leavePublicList("public-1")).resolves.toBe(true);
    expect(store.joinedListIds).toEqual([]);
    expect(store.canWriteToList(ctx.state.lists[1])).toBe(false);
  });

  it("pushes a newly created list before changing visibility remotely", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [
      {
        id: "new-1",
        title: "New",
        owner: "user-1",
        updated: new Date("2026-01-03"),
      },
    ];
    ctx.state.observations = [{ id: "obs-1", listId: "new-1", name: "Crow" }];
    ctx.state.comments = [{ id: "com-1", listId: "new-1", comment: "x" }];
    ctx.setListVisibilitySpy.mockResolvedValue({
      success: true,
      data: { targetRealmId: "rlm-public" },
    });

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await expect(store.setListPublicVisibility("new-1", true)).resolves.toMatchObject({
      success: true,
    });

    expect(ctx.db.cloud.sync).toHaveBeenCalledWith({ wait: true, purpose: "push" });
    expect(ctx.setListVisibilitySpy).toHaveBeenCalledWith("new-1", true);
    expect(ctx.state.lists[0].realmId).toBe("rlm-public");
    expect(ctx.state.observations[0].realmId).toBe("rlm-public");
    expect(ctx.state.comments[0].realmId).toBe("rlm-public");
  });

  it("does not call visibility API when pre-sync fails", async () => {
    const ctx = createMockContext();
    seedLists(ctx);
    ctx.db.cloud.sync.mockRejectedValue(new Error("offline"));

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await expect(store.setListPublicVisibility("private-1", true)).resolves.toMatchObject({
      success: false,
    });

    expect(ctx.setListVisibilitySpy).not.toHaveBeenCalled();
    expect(ctx.state.lists[0].realmId).toBe("owner-1");
  });

  it("deletes a public list through remote + local cleanup", async () => {
    const ctx = createMockContext();
    seedLists(ctx);
    ctx.state.observations = [{ id: "obs-1", listId: "public-1", name: "Crow" }];
    ctx.state.comments = [{ id: "com-1", listId: "public-1", text: "x" }];
    ctx.state.joinedLists = [{ id: "jn-1", userId: "user-1", listId: "public-1" }];
    ctx.deleteListRemotelySpy.mockResolvedValue({ success: true });
    vi.stubGlobal("confirm", vi.fn(() => true));

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await store.deleteList("public-1");

    expect(ctx.deleteListRemotelySpy).toHaveBeenCalledWith("public-1", true);
    expect(ctx.state.lists.find((row) => row.id === "public-1")).toBeUndefined();
    expect(ctx.state.observations.find((row) => row.listId === "public-1")).toBeUndefined();
    expect(ctx.state.comments.find((row) => row.listId === "public-1")).toBeUndefined();
    expect(ctx.state.joinedLists.find((row) => row.listId === "public-1")).toBeUndefined();
    expect(ctx.pushSpy).toHaveBeenCalledWith({ name: "lists" });
  });

  it("aborts local delete when remote delete fails for public list", async () => {
    const ctx = createMockContext();
    seedLists(ctx);
    ctx.deleteListRemotelySpy.mockResolvedValue({ success: false, message: "boom" });
    vi.stubGlobal("confirm", vi.fn(() => true));

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await store.deleteList("public-1");

    expect(ctx.state.lists.find((row) => row.id === "public-1")).toBeTruthy();
    expect(ctx.addMessageSpy).toHaveBeenCalledWith("boom");
  });

  it("accept invite removes stale joined link for list that is no longer public", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [
      {
        id: "list-1",
        title: "Competition",
        owner: "owner-1",
        realmId: "realm-private-1",
        updated: new Date("2026-01-03"),
      },
    ];
    ctx.state.joinedLists = [
      { id: "jn-1", userId: "user-1", listId: "list-1", joinedAt: new Date("2026-01-01") },
    ];

    const invite = {
      realmId: "realm-private-1",
      accept: vi.fn().mockResolvedValue(undefined),
    };

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    expect(store.joinedListIds).toContain("list-1");
    await expect(store.acceptInvite(invite)).resolves.toBe(true);
    expect(invite.accept).toHaveBeenCalledTimes(1);
    expect(store.joinedListIds).not.toContain("list-1");
    expect(ctx.state.joinedLists.find((row) => row.listId === "list-1")).toBeUndefined();
  });
});

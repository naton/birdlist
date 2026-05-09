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
        state[tableName] = state[tableName].map((row) => {
          if (!matchesQuery(row, query)) {
            return row;
          }

          if (typeof changes === "function") {
            const nextRow = { ...row };
            changes(nextRow);
            return nextRow;
          }

          return { ...row, ...changes };
        });
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
      async bulkDelete(ids) {
        const idSet = new Set(ids);
        state.members = state.members.filter((row) => !idSet.has(row.id));
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
    leavePublicListRemotelySpy: vi.fn(),
    setListVisibilitySpy: vi.fn(),
    unsubscribeFromListNotificationsSpy: vi.fn().mockResolvedValue(true),
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
    leavePublicListRemotely: (...args) => ctx.leavePublicListRemotelySpy(...args),
    setListVisibility: (...args) => ctx.setListVisibilitySpy(...args),
    unsubscribeFromListNotifications: (...args) => ctx.unsubscribeFromListNotificationsSpy(...args),
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

  it("allows public list writes when owner matches a nested current-user identity", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [
      {
        id: "public-owned-1",
        title: "Public owned",
        owner: "owner@example.com",
        realmId: "rlm-public",
        updated: new Date("2026-01-02"),
      },
    ];
    ctx.currentUserRef.value = {
      userId: "usr-1",
      name: "Birder 5286",
      claims: {
        email: "owner@example.com",
      },
    };

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    expect(store.canWriteToList(ctx.state.lists[0])).toBe(true);
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
        realmId: "user-1",
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
    expect(ctx.state.lists[0].privateRealmId).toBe("user-1");
    expect(ctx.state.observations[0].realmId).toBe("rlm-public");
    expect(ctx.state.comments[0].realmId).toBe("rlm-public");
  });

  it("stores owner identity when creating a logged-in list", async () => {
    const ctx = createMockContext();
    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    const id = await store.createList({ title: "New list", type: "normal" });

    expect(ctx.state.lists.find((list) => list.id === id)).toMatchObject({
      owner: "user@example.com",
      realmId: "user@example.com",
    });
  });

  it("opens checklist edit mode immediately for new checklists", async () => {
    const ctx = createMockContext();
    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await store.createList({ title: "Checklist", type: "checklist" });

    expect(store.checkListEditMode).toBe(true);
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

  it("does not make a public list private when inviting friends", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [
      {
        id: "public-1",
        title: "Public",
        owner: "user@example.com",
        realmId: "rlm-public",
        updated: new Date("2026-01-02"),
      },
    ];
    ctx.state.observations = [{ id: "obs-1", listId: "public-1", realmId: "rlm-public" }];
    ctx.state.comments = [{ id: "com-1", listId: "public-1", realmId: "rlm-public" }];

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await store.shareBirdList("public-1", "Public", [{ email: "friend@example.com" }]);

    expect(ctx.state.lists[0].realmId).toBe("rlm-public");
    expect(ctx.state.lists[0].privateRealmId).toBe("realm-public-1");
    expect(ctx.state.observations[0].realmId).toBe("rlm-public");
    expect(ctx.state.comments[0].realmId).toBe("rlm-public");
    expect(ctx.state.realms).toContainEqual({
      realmId: "realm-public-1",
      name: "Public",
      represents: "a bird list",
    });
    expect(ctx.state.members).toEqual([
      expect.objectContaining({
        realmId: "realm-public-1",
        email: "friend@example.com",
        invite: true,
      }),
    ]);
  });

  it("keeps private list invite behavior by moving the list into its tied realm", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [
      {
        id: "private-1",
        title: "Private",
        owner: "user@example.com",
        realmId: "user@example.com",
        updated: new Date("2026-01-02"),
      },
    ];
    ctx.state.observations = [{ id: "obs-1", listId: "private-1", realmId: "user@example.com" }];
    ctx.state.comments = [{ id: "com-1", listId: "private-1", realmId: "user@example.com" }];

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await store.shareBirdList("private-1", "Private", [{ email: "friend@example.com" }]);

    expect(ctx.state.lists[0].realmId).toBe("realm-private-1");
    expect(ctx.state.lists[0].privateRealmId).toBe("realm-private-1");
    expect(ctx.state.observations[0].realmId).toBe("realm-private-1");
    expect(ctx.state.comments[0].realmId).toBe("realm-private-1");
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

  it("accept invite to a public list tied realm marks the user as joined", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [
      {
        id: "public-1",
        title: "Public",
        owner: "owner-1",
        realmId: "rlm-public",
        updated: new Date("2026-01-03"),
      },
    ];

    const invite = {
      realmId: "realm-public-1",
      accept: vi.fn().mockResolvedValue(undefined),
    };

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await expect(store.acceptInvite(invite)).resolves.toBe(true);

    expect(invite.accept).toHaveBeenCalledTimes(1);
    expect(store.joinedListIds).toContain("public-1");
    expect(ctx.state.joinedLists).toEqual([
      expect.objectContaining({
        userId: "user-1",
        listId: "public-1",
      }),
    ]);
    expect(store.canWriteToList(ctx.state.lists[0])).toBe(true);
  });

  it("leaves a public joined list by detaching own observations and removing the join", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [
      {
        id: "public-1",
        title: "Public",
        owner: "owner-1",
        realmId: "rlm-public",
        updated: new Date("2026-01-03"),
      },
    ];
    ctx.state.observations = [
      { id: "obs-1", listId: "public-1", owner: "user@example.com", realmId: "rlm-public" },
      { id: "obs-2", listId: "public-1", owner: "someone@example.com", realmId: "rlm-public" },
    ];
    ctx.state.joinedLists = [{ id: "jn-1", userId: "user-1", listId: "public-1" }];
    ctx.leavePublicListRemotelySpy.mockResolvedValue({ success: true, data: {} });

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await expect(store.leaveList("public-1")).resolves.toMatchObject({ success: true });

    expect(ctx.unsubscribeFromListNotificationsSpy).toHaveBeenCalledWith("public-1");
    expect(ctx.leavePublicListRemotelySpy).toHaveBeenCalledWith(
      "public-1",
      expect.arrayContaining(["user@example.com"]),
      ""
    );
    expect(ctx.state.observations.find((row) => row.id === "obs-1")).toMatchObject({
      listId: null,
      realmId: "user@example.com",
    });
    expect(ctx.state.observations.find((row) => row.id === "obs-2")).toMatchObject({
      listId: "public-1",
    });
    expect(ctx.state.joinedLists.find((row) => row.listId === "public-1")).toBeUndefined();
    expect(ctx.pushSpy).toHaveBeenCalledWith({ name: "lists" });
  });

  it("leaves a private shared list by detaching own observations and removing membership", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [
      {
        id: "private-1",
        title: "Private",
        owner: "owner-1",
        realmId: "realm-private-1",
        privateRealmId: "realm-private-1",
        updated: new Date("2026-01-03"),
      },
    ];
    ctx.state.observations = [
      { id: "obs-1", listId: "private-1", owner: "user@example.com", realmId: "realm-private-1" },
      { id: "obs-2", listId: "private-1", owner: "owner-1", realmId: "realm-private-1" },
    ];
    ctx.state.members = [
      { id: "mem-1", realmId: "realm-private-1", email: "user@example.com", accepted: true },
      { id: "mem-2", realmId: "realm-private-1", email: "other@example.com", accepted: true },
    ];

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await expect(store.leaveList("private-1")).resolves.toMatchObject({ success: true });

    expect(ctx.state.observations.find((row) => row.id === "obs-1")).toMatchObject({
      listId: null,
      realmId: "user@example.com",
    });
    expect(ctx.state.observations.find((row) => row.id === "obs-2")).toMatchObject({
      listId: "private-1",
    });
    expect(ctx.state.members.find((row) => row.id === "mem-1")).toBeUndefined();
    expect(ctx.state.members.find((row) => row.id === "mem-2")).toBeTruthy();
    expect(store.canWriteToList(ctx.state.lists[0])).toBe(false);
  });

  it("transfers list ownership when the owner leaves", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [
      {
        id: "private-1",
        title: "Private",
        owner: "user@example.com",
        realmId: "realm-private-1",
        privateRealmId: "realm-private-1",
        updated: new Date("2026-01-03"),
      },
    ];
    ctx.state.observations = [
      { id: "obs-1", listId: "private-1", owner: "user@example.com", realmId: "realm-private-1" },
    ];

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await expect(store.leaveList("private-1", { newOwner: "friend@example.com" })).resolves.toMatchObject({
      success: true,
    });

    expect(ctx.state.lists[0].owner).toBe("friend@example.com");
    expect(ctx.state.observations[0]).toMatchObject({
      listId: null,
      realmId: "user@example.com",
    });
    expect(store.canWriteToList(ctx.state.lists[0])).toBe(false);
  });

  it("includes active private members even when accepted is missing", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [
      {
        id: "private-1",
        title: "Private",
        owner: "user@example.com",
        realmId: "realm-private-1",
        privateRealmId: "realm-private-1",
        updated: new Date("2026-01-03"),
      },
    ];
    ctx.state.members = [
      { id: "mem-1", realmId: "realm-private-1", userId: "friend@example.com" },
      { id: "mem-2", realmId: "realm-private-1", email: "pending@example.com", accepted: false },
    ];

    const useListsStore = await loadStoreWithMocks(ctx);
    const store = useListsStore();
    await flushLiveQuery();

    await expect(store.getListMembers("private-1")).resolves.toEqual([
      expect.objectContaining({ email: "friend@example.com" }),
      expect.objectContaining({ email: "user@example.com" }),
    ]);
  });
});

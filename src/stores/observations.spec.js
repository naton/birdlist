import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";

function createMockContext() {
  const state = {
    observations: [],
    lists: [],
  };

  let idCounter = 1;

  function matchesQuery(row, query) {
    return Object.entries(query).every(([key, value]) => row[key] === value);
  }

  const db = {
    cloud: {
      sync: vi.fn().mockResolvedValue(undefined),
    },
    async transaction(_mode, _tables, fn) {
      return await fn();
    },
    observations: {
      async toArray() {
        return [...state.observations];
      },
      async add(payload) {
        const id = payload.id || `obs-${idCounter++}`;
        state.observations.push({ ...payload, id });
        return id;
      },
      async delete(id) {
        state.observations = state.observations.filter((row) => row.id !== id);
      },
      async update(obs, payload) {
        const row = state.observations.find((item) => item.id === obs.id);
        if (!row) return 0;
        Object.assign(row, payload);
        return 1;
      },
      async bulkUpdate(updates) {
        const byId = new Map(state.observations.map((row) => [row.id, row]));
        updates.forEach((update) => {
          const row = byId.get(update.key);
          if (row) {
            Object.assign(row, update.changes);
          }
        });
      },
      where(query) {
        return {
          async toArray() {
            return state.observations.filter((row) => matchesQuery(row, query));
          },
          async modify(changes) {
            state.observations = state.observations.map((row) =>
              matchesQuery(row, query) ? { ...row, ...changes } : row
            );
          },
        };
      },
    },
    lists: {
      where(query) {
        return {
          async modify(changes) {
            state.lists = state.lists.map((row) =>
              matchesQuery(row, query) ? { ...row, ...changes } : row
            );
          },
        };
      },
      async update(id, changes) {
        const row = state.lists.find((item) => item.id === id);
        if (!row) return 0;
        Object.assign(row, changes);
        return 1;
      },
    },
  };

  return {
    state,
    db,
    currentUserRef: ref({
      userId: "user-1",
      name: "User One",
      email: "user@example.com",
    }),
    currentYearRef: ref(2026),
    currentMonthRef: ref(3),
    currentListRef: ref({
      id: "list-1",
      title: "Bingo",
      realmId: "user-1",
    }),
    allListsRef: ref(state.lists),
    canWriteRef: ref(true),
    addMessageSpy: vi.fn(),
    pushNewBirdAlertSpy: vi.fn(),
    savePublicObservationSpy: vi.fn().mockResolvedValue({ success: true }),
  };
}

async function loadStoreWithMocks(ctx) {
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
  vi.doMock("../helpers", () => ({
    pushNewBirdAlert: (...args) => ctx.pushNewBirdAlertSpy(...args),
    savePublicObservation: (...args) => ctx.savePublicObservationSpy(...args),
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
      currentYear: ctx.currentYearRef,
      currentMonth: ctx.currentMonthRef,
      t: (key) => key,
    }));
    return { useSettingsStore };
  });
  vi.doMock("./lists.js", async () => {
    const { defineStore } = await import("pinia");
    const useListsStore = defineStore("list", () => ({
      allLists: ctx.allListsRef,
      currentList: ctx.currentListRef,
      canWriteToList: () => ctx.canWriteRef.value,
      isPublicList: (list) => list?.realmId === "rlm-public",
    }));
    return { useListsStore };
  });

  const mod = await import("./observations.js");
  return mod.useObservationsStore;
}

async function flushLiveQuery() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("observations store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    setActivePinia(createPinia());
  });

  it("returns false for invalid bird input", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [{ id: "list-1", updated: new Date("2026-01-01") }];
    const useObservationsStore = await loadStoreWithMocks(ctx);
    const store = useObservationsStore();
    await flushLiveQuery();

    await expect(store.addObservation("")).resolves.toBe(false);
    expect(ctx.state.observations).toHaveLength(0);
  });

  it("blocks writes for read-only lists", async () => {
    const ctx = createMockContext();
    ctx.canWriteRef.value = false;
    ctx.state.lists = [{ id: "list-1", updated: new Date("2026-01-01") }];
    const useObservationsStore = await loadStoreWithMocks(ctx);
    const store = useObservationsStore();
    await flushLiveQuery();

    await expect(store.addObservation("Mallard")).resolves.toBe(false);
    expect(ctx.state.observations).toHaveLength(0);
    expect(ctx.addMessageSpy).toHaveBeenCalledWith("List_Is_Read_Only_For_You");
  });

  it("adds observation, triggers push, and updates list timestamp", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [{ id: "list-1", updated: new Date("2026-01-01") }];
    const useObservationsStore = await loadStoreWithMocks(ctx);
    const store = useObservationsStore();
    await flushLiveQuery();

    await expect(store.addObservation("Mallard")).resolves.toBe(true);
    expect(ctx.state.observations).toHaveLength(1);
    expect(ctx.state.observations[0]).toMatchObject({
      name: "Mallard",
      listId: "list-1",
      realmId: "user-1",
    });

    vi.runAllTimers();
    expect(ctx.pushNewBirdAlertSpy).toHaveBeenCalledTimes(1);
    expect(ctx.pushNewBirdAlertSpy.mock.calls[0][0].notification).toMatchObject({
      type: "new-observation",
      listId: "list-1",
      listTitle: "Bingo",
      bird: {
        name: "Mallard",
      },
    });
    expect(ctx.state.lists[0].updated).toBeInstanceOf(Date);
  });

  it("includes synced Dexie Cloud date objects in month and year lists", async () => {
    const ctx = createMockContext();
    ctx.currentYearRef.value = 2026;
    ctx.currentMonthRef.value = 3;
    ctx.state.observations = [
      {
        id: "obs-1",
        name: "Mallard",
        owner: "user-1",
        date: { $t: "Date", v: "2026-04-05T12:00:00.000Z" },
      },
    ];
    const useObservationsStore = await loadStoreWithMocks(ctx);
    const store = useObservationsStore();
    await flushLiveQuery();

    expect(store.allMyObservations).toHaveLength(1);
    expect(store.allThisMonth).toHaveLength(1);
    expect(store.getTotalPerMonth(3)).toBe(1);
  });

  it("treats comma-separated input as one observation", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [{ id: "list-1", updated: new Date("2026-01-01") }];
    ctx.allListsRef.value = ctx.state.lists;
    const useObservationsStore = await loadStoreWithMocks(ctx);
    const store = useObservationsStore();
    await flushLiveQuery();

    await expect(store.addObservation("Mallard, Robin")).resolves.toBe(true);

    expect(ctx.state.observations).toHaveLength(1);
    expect(ctx.state.observations[0].name).toBe("Mallard, Robin");
  });

  it("saves public-list observations through the trusted API and pulls the result", async () => {
    const ctx = createMockContext();
    ctx.currentListRef.value = {
      id: "public-list-1",
      title: "Public",
      realmId: "rlm-public",
    };
    ctx.state.lists = [{ id: "public-list-1", updated: new Date("2026-01-01") }];
    const useObservationsStore = await loadStoreWithMocks(ctx);
    const store = useObservationsStore();
    await flushLiveQuery();

    await expect(store.addObservation("Mallard")).resolves.toBe(true);

    expect(ctx.savePublicObservationSpy).toHaveBeenCalledWith(expect.objectContaining({
      name: "Mallard",
      listId: "public-list-1",
      realmId: "rlm-public",
      owner: "user-1",
      ownerAliases: expect.arrayContaining(["user-1", "User One", "user@example.com"]),
    }));
    expect(ctx.state.observations).toHaveLength(0);
    expect(ctx.db.cloud.sync).toHaveBeenCalledWith({ wait: true });

    vi.runAllTimers();
    expect(ctx.pushNewBirdAlertSpy).not.toHaveBeenCalled();
  });

  it("deletes observation and emits message with species name", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [{ id: "list-1", updated: new Date("2026-01-01") }];
    ctx.state.observations = [
      {
        id: "obs-1",
        name: "Robin",
        date: new Date("2026-04-05"),
        listId: "list-1",
        owner: "user-1",
      },
    ];
    const useObservationsStore = await loadStoreWithMocks(ctx);
    const store = useObservationsStore();
    await flushLiveQuery();

    await store.deleteObservation("obs-1");
    expect(ctx.state.observations).toHaveLength(0);
    expect(ctx.addMessageSpy).toHaveBeenCalledWith("Observation_Removed: <b>Robin</b>");
  });

  it("moves an observation to another list", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [
      { id: "list-1", realmId: "realm-1", updated: new Date("2026-01-01") },
      { id: "list-2", realmId: "realm-2", updated: new Date("2026-01-01") },
    ];
    ctx.allListsRef.value = ctx.state.lists;
    ctx.state.observations = [
      {
        id: "obs-1",
        name: "Mallard",
        latinName: "Anas platyrhynchos",
        date: new Date("2026-04-05"),
        listId: "list-1",
        realmId: "realm-1",
        owner: "user-1",
      },
    ];
    const useObservationsStore = await loadStoreWithMocks(ctx);
    const store = useObservationsStore();
    await flushLiveQuery();

    await store.saveObservation({
      ...ctx.state.observations[0],
      listId: "list-2",
      previousListId: "list-1",
    });

    expect(ctx.state.observations[0]).toMatchObject({
      listId: "list-2",
      realmId: "realm-2",
    });
    expect(ctx.state.lists[0].updated).toBeInstanceOf(Date);
    expect(ctx.state.lists[1].updated).toBeInstanceOf(Date);
  });

  it("moves an observation into a shared list even when list metadata is read-only", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [
      { id: "list-1", realmId: "realm-1", updated: new Date("2026-01-01") },
      { id: "list-2", realmId: "realm-2", updated: new Date("2026-01-01") },
    ];
    ctx.allListsRef.value = ctx.state.lists;
    ctx.state.observations = [
      {
        id: "obs-1",
        name: "Mallard",
        latinName: "Anas platyrhynchos",
        date: new Date("2026-04-05"),
        listId: null,
        realmId: "user-1",
        owner: "user-1",
      },
    ];
    ctx.db.lists.update = vi.fn().mockRejectedValue(new Error("Permission denied"));
    const useObservationsStore = await loadStoreWithMocks(ctx);
    const store = useObservationsStore();
    await flushLiveQuery();

    await expect(store.saveObservation({
      ...ctx.state.observations[0],
      listId: "list-2",
      previousListId: null,
    })).resolves.toBe(true);

    expect(ctx.state.observations[0]).toMatchObject({
      listId: "list-2",
      realmId: "realm-2",
    });
  });

  it("saves observation edits to public lists through the trusted API", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [
      { id: "list-1", realmId: "realm-1", updated: new Date("2026-01-01") },
      { id: "public-list-1", realmId: "rlm-public", updated: new Date("2026-01-01") },
    ];
    ctx.allListsRef.value = ctx.state.lists;
    ctx.state.observations = [
      {
        id: "obs-1",
        name: "Mallard",
        latinName: "Anas platyrhynchos",
        date: new Date("2026-04-05"),
        listId: "list-1",
        realmId: "realm-1",
        owner: "user-1",
      },
    ];
    const useObservationsStore = await loadStoreWithMocks(ctx);
    const store = useObservationsStore();
    await flushLiveQuery();

    await expect(store.saveObservation({
      ...ctx.state.observations[0],
      listId: "public-list-1",
      previousListId: "list-1",
    })).resolves.toBe(true);

    expect(ctx.savePublicObservationSpy).toHaveBeenCalledWith(expect.objectContaining({
      id: "obs-1",
      listId: "public-list-1",
      realmId: "rlm-public",
      owner: "user-1",
      ownerAliases: expect.arrayContaining(["user-1", "User One", "user@example.com"]),
    }));
    expect(ctx.db.cloud.sync).toHaveBeenCalledWith({ wait: true });
  });

  it("removes an observation from lists when no special list is selected", async () => {
    const ctx = createMockContext();
    ctx.state.lists = [{ id: "list-1", realmId: "realm-1", updated: new Date("2026-01-01") }];
    ctx.allListsRef.value = ctx.state.lists;
    ctx.state.observations = [
      {
        id: "obs-1",
        name: "Mallard",
        latinName: "Anas platyrhynchos",
        date: new Date("2026-04-05"),
        listId: "list-1",
        realmId: "realm-1",
        owner: "user-1",
      },
    ];
    const useObservationsStore = await loadStoreWithMocks(ctx);
    const store = useObservationsStore();
    await flushLiveQuery();

    await store.saveObservation({
      ...ctx.state.observations[0],
      listId: null,
      previousListId: "list-1",
    });

    expect(ctx.state.observations[0]).toMatchObject({
      listId: null,
      realmId: "user-1",
    });
    expect(ctx.state.lists[0].updated).toBeInstanceOf(Date);
  });
});

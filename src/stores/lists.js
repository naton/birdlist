import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { defineStore, storeToRefs } from "pinia";
import { db } from "../db";
import { liveQuery } from "dexie";
import { getTiedRealmId } from "dexie-cloud-addon";
import {
  deleteListRemotely,
  leavePublicListRemotely,
  setListVisibility,
  unsubscribeFromListNotifications,
} from "../helpers";
import { getBirdLatinName, getBirdStorageName } from "@/birdNames.js";
import { useSettingsStore } from "./settings";
import { useMessagesStore } from "./messages";

export const useListsStore = defineStore("list", () => {
  const messagesStore = useMessagesStore();
  const { addMessage } = messagesStore;

  const route = useRoute();
  const router = useRouter();

  const settingsStore = useSettingsStore();
  const { currentUser, isUserLoggedIn } = storeToRefs(settingsStore);
  const { t } = settingsStore;

  const allLists = ref([]);
  const joinedListIds = ref([]);
  const hiddenListIds = ref([]);
  let joinedListsSubscription = null;

  function addAlias(aliases, value) {
    const alias = String(value || "").trim();
    if (alias && alias !== "undefined" && alias !== "null") {
      aliases.add(alias);
    }
  }

  function collectUserAliases(value, aliases, key = "") {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === "string") {
      const keyLooksLikeIdentity = ["userId", "name", "email", "sub", "preferred_username"].includes(key);
      const valueLooksLikeIdentity = value.includes("@");
      if (keyLooksLikeIdentity || valueLooksLikeIdentity) {
        addAlias(aliases, value);
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => collectUserAliases(item, aliases));
      return;
    }

    if (typeof value === "object") {
      for (const [childKey, childValue] of Object.entries(value)) {
        collectUserAliases(childValue, aliases, childKey);
      }
    }
  }

  function getCurrentOwnerAliases() {
    const aliases = new Set();
    collectUserAliases(currentUser.value, aliases);
    return [...aliases];
  }

  function getPreferredOwnerAlias() {
    const user = currentUser.value || {};
    return user.email || user.userId || user.name || "";
  }

  function getPrivateListRealmId(list) {
    return String(list?.privateRealmId || getTiedRealmId(list?.id || "") || list?.realmId || "").trim();
  }

  function isOwnedByCurrentUser(list) {
    if (!list?.owner) {
      return false;
    }
    return getCurrentOwnerAliases().includes(list.owner);
  }

  function isPublicList(list) {
    return list?.realmId === "rlm-public";
  }

  function isJoinedList(listId) {
    return joinedListIds.value.includes(String(listId));
  }

  function canWriteToList(list) {
    if (!list) {
      return false;
    }

    if (hiddenListIds.value.includes(String(list.id))) {
      return false;
    }

    if (!isPublicList(list)) {
      return true;
    }

    if (isOwnedByCurrentUser(list)) {
      return true;
    }

    return Boolean(isUserLoggedIn.value && isJoinedList(list.id));
  }

  async function joinPublicList(listId) {
    const normalizedListId = String(listId ?? "").trim();
    if (!normalizedListId) {
      return false;
    }

    const list = allLists.value?.find((item) => String(item.id) === normalizedListId);
    if (!list || !isPublicList(list) || isOwnedByCurrentUser(list)) {
      return false;
    }

    if (!isUserLoggedIn.value) {
      addMessage(t("You_Need_To_Login_First"));
      return false;
    }

    const userId = currentUser.value?.userId;
    if (!userId || userId === "unauthorized") {
      addMessage(t("You_Need_To_Login_First"));
      return false;
    }

    try {
      const existing = await db.joinedLists.where("[userId+listId]").equals([userId, normalizedListId]).first();
      if (existing?.id) {
        await db.joinedLists.update(existing.id, { updated: new Date() });
      } else {
        await db.joinedLists.add({
          userId,
          listId: normalizedListId,
          joinedAt: new Date(),
          updated: new Date(),
        });
      }

      if (!joinedListIds.value.includes(normalizedListId)) {
        joinedListIds.value.push(normalizedListId);
      }
      hiddenListIds.value = hiddenListIds.value.filter((id) => id !== normalizedListId);

      addMessage(t("List_Joined"));
      return true;
    } catch (error) {
      console.error("Failed to join list.", error);
      addMessage(t("List_Join_Failed"));
      return false;
    }
  }

  async function leavePublicList(listId) {
    const normalizedListId = String(listId ?? "").trim();
    if (!normalizedListId) {
      return false;
    }

    const list = allLists.value?.find((item) => String(item.id) === normalizedListId);
    if (!list || !isPublicList(list) || isOwnedByCurrentUser(list)) {
      return false;
    }

    const userId = currentUser.value?.userId;
    if (!userId || userId === "unauthorized") {
      return false;
    }

    try {
      const existing = await db.joinedLists.where("[userId+listId]").equals([userId, normalizedListId]).toArray();
      if (existing.length > 0) {
        await db.joinedLists.bulkDelete(existing.map((item) => item.id).filter(Boolean));
      }
      joinedListIds.value = joinedListIds.value.filter((id) => id !== normalizedListId);
      addMessage(t("List_Left"));
      return true;
    } catch (error) {
      console.error("Failed to leave list.", error);
      addMessage(t("List_Leave_Failed"));
      return false;
    }
  }

  function getInviteRealmId(invite) {
    return String(
      invite?.realmId ||
      invite?.realm?.realmId ||
      invite?.realm?.id ||
      ""
    ).trim();
  }

  async function syncJoinedStateForInviteRealm(realmId) {
    if (!realmId) {
      return;
    }

    const userId = currentUser.value?.userId;
    if (!userId || userId === "unauthorized") {
      return;
    }

    const listsInRealm = (allLists.value || []).filter((list) => {
      const listRealmId = String(list?.realmId || "");
      const tiedRealmId = String(getTiedRealmId(list?.id || ""));
      return listRealmId === realmId || tiedRealmId === realmId;
    });

    for (const list of listsInRealm) {
      const listId = String(list?.id || "").trim();
      if (!listId) {
        continue;
      }
      hiddenListIds.value = hiddenListIds.value.filter((id) => id !== listId);

      const existingRows = await db.joinedLists
        .where("[userId+listId]")
        .equals([userId, listId])
        .toArray();

      // Joined rows are only needed for public lists. If an invited list is private now,
      // remove stale joined rows from when it used to be public.
      if (!isPublicList(list)) {
        if (existingRows.length > 0) {
          await db.joinedLists.bulkDelete(existingRows.map((row) => row.id).filter(Boolean));
        }
        joinedListIds.value = joinedListIds.value.filter((id) => id !== listId);
      } else if (existingRows.length === 0) {
        await db.joinedLists.add({
          userId,
          listId,
          joinedAt: new Date(),
          updated: new Date(),
        });
        if (!joinedListIds.value.includes(listId)) {
          joinedListIds.value.push(listId);
        }
      }
    }
  }

  async function acceptInvite(invite) {
    if (!invite || typeof invite.accept !== "function") {
      return false;
    }

    try {
      await invite.accept();
      await syncJoinedStateForInviteRealm(getInviteRealmId(invite));
      return true;
    } catch (error) {
      console.error("Failed to accept invite.", error);
      return false;
    }
  }

  const allMyLists = computed(() => allLists.value?.filter((list) => isOwnedByCurrentUser(list)) || []);
  const allMineLists = computed(
    () =>
      allLists.value?.filter(
        (list) =>
          !hiddenListIds.value.includes(String(list.id)) &&
          (!isPublicList(list) || isOwnedByCurrentUser(list) || isJoinedList(list.id))
      ) || []
  );
  const allPublicLists = computed(
    () => allLists.value?.filter((list) => isPublicList(list)) || []
  );
  const currentSort = ref("bydate");
  const currentListExpanded = ref(true);
  const currentList = ref();
  const lastUsedList = ref();
  const checkListEditMode = ref(false);

  /* Lists */
  liveQuery(async () => await db.lists.toArray()).subscribe(
    (lists) => {
      // sort all lists by id, latest first
      allLists.value = lists.sort((a, b) => b.updated - a.updated);
      currentList.value = allLists.value.find((list) => list.id == route.params.id);
      // if last used list is deleted, reset it
      if (lastUsedList.value && !allLists.value.find((list) => list.id == lastUsedList.value.id)) {
        lastUsedList.value = null;
      }
    },
    (error) => {
      console.log(error);
    }
  );

  function subscribeJoinedLists(userId) {
    if (joinedListsSubscription) {
      joinedListsSubscription.unsubscribe();
      joinedListsSubscription = null;
    }

    if (!userId || userId === "unauthorized") {
      joinedListIds.value = [];
      return;
    }

    joinedListsSubscription = liveQuery(async () => db.joinedLists.where({ userId }).toArray()).subscribe(
      (joinedLists) => {
        joinedListIds.value = joinedLists.map((item) => String(item.listId));
      },
      (error) => {
        console.log(error);
      }
    );
  }

  watch(
    () => currentUser.value?.userId,
    (userId) => {
      subscribeJoinedLists(userId);
    },
    { immediate: true }
  );

  function sortBy(val) {
    return (currentSort.value = val);
  }

  async function createList(payload) {
    // Insert the list in the db with title and descripton
    const owner = payload.owner || (isUserLoggedIn.value ? getPreferredOwnerAlias() : "");
    const listPayload = owner
      ? {
          ...payload,
          owner,
          realmId: payload.realmId || owner,
        }
      : payload;
    const newId = await db.lists.add(listPayload);
    lastUsedList.value = currentList.value = allLists.value.find((list) => list.id == newId);
    return newId;
  }

  async function updateList(payload, callback) {
    if (!payload?.id) {
      return;
    }

    const { id, ...changes } = payload;

    await db.transaction("rw", [db.lists], async () => {
      await db.lists.update(id, changes);
    });
    if (callback) {
      callback();
    }
  }

  async function pushPendingCloudChanges() {
    if (typeof db.cloud?.sync !== "function") {
      return;
    }

    await db.cloud.sync({
      wait: true,
      purpose: "push",
    });
  }

  async function setListPublicVisibility(listId, makePublic) {
    const normalizedListId = String(listId ?? "").trim();
    if (!normalizedListId) {
      return {
        success: false,
        message: t("List_Visibility_Update_Failed"),
      };
    }

    try {
      await pushPendingCloudChanges();
    } catch (error) {
      console.error("Failed to sync list before changing visibility.", error);
      return {
        success: false,
        message: t("List_Visibility_Update_Failed"),
      };
    }

    const result = await setListVisibility(normalizedListId, makePublic);
    const targetRealmId = result?.data?.targetRealmId;
    if (!result?.success || !targetRealmId) {
      return result;
    }

    await db.transaction("rw", [db.lists, db.observations, db.comments], async () => {
      const currentLocalList = allLists.value?.find((item) => String(item.id) === normalizedListId);
      const previousRealmId = String(currentLocalList?.realmId || "");
      await db.lists.update(normalizedListId, {
        realmId: targetRealmId,
        ...(makePublic && previousRealmId && previousRealmId !== "rlm-public"
          ? { privateRealmId: previousRealmId }
          : {}),
        updated: new Date(),
      });
      await db.observations.where({ listId: normalizedListId }).modify({ realmId: targetRealmId });
      await db.comments.where({ listId: normalizedListId }).modify({ realmId: targetRealmId });
    });

    if (currentList.value?.id === normalizedListId) {
      if (makePublic && currentList.value.realmId && currentList.value.realmId !== "rlm-public") {
        currentList.value.privateRealmId = currentList.value.realmId;
      }
      currentList.value.realmId = targetRealmId;
      currentList.value.updated = new Date();
    }

    return result;
  }

  async function convertToChecklist(list) {
    let newList = { ...list };
    delete newList.id;
    newList.type = "checklist";
    const listObservations = await db.observations.where({ listId: list.id }).toArray();
    newList.birds = listObservations.map((obs) => {
      const latinName = obs.latinName || getBirdLatinName(obs.name);
      return latinName ? { latinName, name: getBirdStorageName(obs) } : obs.name;
    });
    const newId = await createList(newList);
    router.push({ name: "list", params: { id: newId} });
    addMessage(t("Checklist_Created") + ": <b>" + list.title + "</b>");
  }

  async function deleteList(listId, options = {}) {
    let deleteRelatedObservations = false;
    const listToDelete = allLists.value?.find((list) => String(list.id) === String(listId));
    const isPublicTargetList = isPublicList(listToDelete);
    const shouldConfirm = options.confirm !== false;

    if (!shouldConfirm || confirm(t("Are_You_Sure_You_Want_To_Delete_This_List"))) {
      deleteRelatedObservations = options.deleteRelatedObservations ?? (
        shouldConfirm ? confirm(t("Delete_The_Lists_Observations_As_Well")) : false
      );

      if (isPublicTargetList) {
        const result = await deleteListRemotely(listId, deleteRelatedObservations);
        if (!result?.success) {
          addMessage(result?.message || t("List_Delete_Failed"));
          return;
        }
      }
  
      await db
        .transaction("rw", [db.lists, db.observations, db.comments, db.realms, db.members, db.joinedLists], () => {
          if (deleteRelatedObservations) {
            // Delete possible observations:
            db.observations.where({ listId: listId }).delete();
          } else {
            db.observations.where({ listId: listId }).modify((observation) => {
              observation.listId = null;
              observation.realmId = observation.owner || getPreferredOwnerAlias() || null;
            });
          }
          // Delete comments tied to list:
          db.comments.where({ listId: listId }).delete();
          // Delete the list:
          db.lists.delete(listId);
          // Remove joined references:
          db.joinedLists.where({ listId }).delete();
          if (!isPublicTargetList) {
            // Delete possible realm and its members in case list was shared:
            const tiedRealmId = getTiedRealmId(listId);
            // Empty out any tied realm from members:
            db.members.where({ realmId: tiedRealmId }).delete();
            // Delete the tied realm if it exists:
            db.realms.delete(tiedRealmId);
          }
        })
        .then(() => {
          document.location.hash = "";
        });
      lastUsedList.value = null;
      router.push({ name: "lists" });
    }
  }

  async function detachCurrentUserObservationsFromList(list) {
    const listId = String(list?.id || "").trim();
    if (!listId) {
      return 0;
    }

    const aliases = new Set(getCurrentOwnerAliases());
    const fallbackRealmId = getPreferredOwnerAlias() || null;
    let detachedCount = 0;

    await db.observations.where({ listId }).modify((observation) => {
      if (!aliases.has(String(observation?.owner || "").trim())) {
        return;
      }

      observation.listId = null;
      observation.realmId = observation.owner || fallbackRealmId;
      detachedCount += 1;
    });

    return detachedCount;
  }

  async function removeCurrentUserPrivateMembership(list) {
    const realmId = getPrivateListRealmId(list);
    if (!realmId) {
      return 0;
    }

    const aliases = new Set(getCurrentOwnerAliases());
    const memberRows = await db.members.where({ realmId }).toArray();
    const memberIds = memberRows
      .filter((member) =>
        aliases.has(String(member?.email || "").trim()) ||
        aliases.has(String(member?.userId || "").trim())
      )
      .map((member) => member.id)
      .filter(Boolean);

    if (memberIds.length > 0) {
      await db.members.bulkDelete(memberIds);
    }

    return memberIds.length;
  }

  async function removeCurrentUserPublicJoin(listId) {
    const userId = currentUser.value?.userId;
    if (!userId || userId === "unauthorized") {
      return 0;
    }

    const existing = await db.joinedLists.where("[userId+listId]").equals([userId, String(listId)]).toArray();
    if (existing.length > 0) {
      await db.joinedLists.bulkDelete(existing.map((item) => item.id).filter(Boolean));
    }
    joinedListIds.value = joinedListIds.value.filter((id) => id !== String(listId));
    return existing.length;
  }

  async function leaveList(listId, options = {}) {
    const normalizedListId = String(listId || "").trim();
    const list = allLists.value?.find((item) => String(item.id) === normalizedListId);
    if (!list) {
      return {
        success: false,
        message: t("List_Leave_Failed"),
      };
    }

    const isOwner = isOwnedByCurrentUser(list);
    const isPublicTargetList = isPublicList(list);
    const newOwner = String(options.newOwner || "").trim();

    try {
      await unsubscribeFromListNotifications(normalizedListId);

      if (isPublicTargetList) {
        const result = await leavePublicListRemotely(normalizedListId, getCurrentOwnerAliases(), newOwner);
        if (!result?.success) {
          return result;
        }

        await detachCurrentUserObservationsFromList(list);
        await removeCurrentUserPublicJoin(normalizedListId);
        if (isOwner && newOwner) {
          await db.lists.update(normalizedListId, { owner: newOwner });
          if (currentList.value?.id === normalizedListId) {
            currentList.value.owner = newOwner;
          }
        }
      } else {
        await detachCurrentUserObservationsFromList(list);
        if (isOwner && newOwner) {
          await db.lists.update(normalizedListId, { owner: newOwner });
          if (currentList.value?.id === normalizedListId) {
            currentList.value.owner = newOwner;
          }
        } else if (!isOwner) {
          await removeCurrentUserPrivateMembership(list);
        }
      }

      hiddenListIds.value = [...new Set([...hiddenListIds.value, normalizedListId])];
      if (lastUsedList.value?.id === normalizedListId) {
        lastUsedList.value = null;
      }
      if (currentList.value?.id === normalizedListId) {
        currentList.value = null;
      }
      router.push({ name: "lists" });
      addMessage(t("List_Left"));
      return { success: true };
    } catch (error) {
      console.error("Failed to leave list.", error);
      return {
        success: false,
        message: t("List_Leave_Failed"),
      };
    }
  }

  function getMemberIdentity(member) {
    return String(member?.email || member?.userId || "").trim();
  }

  function isActiveMember(member) {
    return getMemberIdentity(member) && member?.accepted !== false && member?.rejected !== true;
  }

  async function getMembersByListId(listId) {
    const list = allLists.value?.find((item) => String(item.id) === String(listId));
    const realmId = getPrivateListRealmId(list || { id: listId });
    return await db.members.where({ realmId }).toArray();
  }

  async function getListMembers(listId) {
    const members = await getMembersByListId(listId);
    members.push({
      email: currentUser.value.email || currentUser.value.userId,
      userId: currentUser.value.userId,
      accepted: true,
    });

    const seen = new Set();
    return members
      .filter(isActiveMember)
      .map((member) => ({
        ...member,
        email: getMemberIdentity(member),
      }))
      .filter((member) => {
        if (seen.has(member.email)) {
          return false;
        }
        seen.add(member.email);
        return true;
      })
      .sort((a, b) => a.email.localeCompare(b.email));
  }  

  async function shareBirdList(listId, listName, friends) {
    if (!listId) return;
    const list = allLists.value?.find((item) => String(item.id) === String(listId));
    const realmId = getTiedRealmId(listId);
    const tables = isPublicList(list)
      ? [db.lists, db.realms, db.members]
      : [db.lists, db.observations, db.comments, db.realms, db.members];
  
    await db.transaction("rw", tables, async () => {
      // Add or update a realm, tied to the list using getTiedRealmId():
      await db.realms.put({
        realmId,
        name: listName,
        represents: "a bird list",
      });

      if (!isPublicList(list)) {
        // Private lists use the tied realm for membership and sync access.
        await db.lists.update(listId, { realmId, privateRealmId: realmId });
        await db.observations.where({ listId: listId }).modify({ realmId: realmId });
        await db.comments.where({ listId: listId }).modify({ realmId: realmId });
      } else {
        await db.lists.update(listId, { privateRealmId: realmId });
      }

      // Add the members to share it to:
      await db.members.bulkAdd(
        [...friends].map((friend) => ({
          realmId,
          email: friend.email,
          invite: true, // Generates invite email on server on sync
          permissions: {
            add: ["observations", "comments"],
            update: {
              observations: ["*", "realmId"],
            },
            // manage: "*", // Give your friend full permissions within this new realm.
          },
        }))
      );
    });
  }

  return {
    allLists,
    allMyLists,
    allMineLists,
    allPublicLists,
    joinedListIds,
    currentList,
    lastUsedList,
    checkListEditMode,
    currentListExpanded,
    currentSort,
    isOwnedByCurrentUser,
    isPublicList,
    isJoinedList,
    canWriteToList,
    joinPublicList,
    leavePublicList,
    leaveList,
    acceptInvite,
    sortBy,
    getListMembers,
    createList,
    updateList,
    setListPublicVisibility,
    convertToChecklist,
    deleteList,
    shareBirdList,
  };
},
{
  persist: {
    key: "birdlist-lists",
    paths: ["currentList", "lastUsedList", "currentSort", "currentListExpanded", "hiddenListIds"],
  },
});

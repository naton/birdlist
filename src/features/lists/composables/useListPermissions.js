import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";

export function useListPermissions(listRef) {
  const settingsStore = useSettingsStore();
  const { isUserLoggedIn, isPremiumUser } = storeToRefs(settingsStore);

  const listsStore = useListsStore();
  const { isOwnedByCurrentUser, isPublicList, isJoinedList, canWriteToList } = listsStore;
  const { checkListEditMode } = storeToRefs(listsStore);

  const isListOwner = computed(() => isOwnedByCurrentUser(listRef.value));
  const isPublicCurrentList = computed(() => isPublicList(listRef.value));
  const isJoinedCurrentList = computed(() => isJoinedList(listRef.value?.id));
  const canWriteToCurrentList = computed(() => canWriteToList(listRef.value));
  const canJoinCurrentList = computed(
    () => isPublicCurrentList.value && !isListOwner.value && !isJoinedCurrentList.value && isUserLoggedIn.value
  );
  const canLeaveCurrentList = computed(
    () => isPublicCurrentList.value && !isListOwner.value && isJoinedCurrentList.value
  );
  const mustLoginToJoin = computed(
    () => isPublicCurrentList.value && !isListOwner.value && !isUserLoggedIn.value
  );
  const showDirectJoinAction = computed(
    () => !canWriteToCurrentList.value && (canJoinCurrentList.value || mustLoginToJoin.value)
  );
  const canEditBirds = computed(
    () => isListOwner.value && (listRef.value?.type === "checklist" || listRef.value?.type === "bingo")
  );
  const canStartEditBirds = computed(() => canEditBirds.value && !checkListEditMode.value);
  const canMakeChecklist = computed(() => isListOwner.value && listRef.value?.type === "normal");

  return {
    isPremiumUser,
    isUserLoggedIn,
    isListOwner,
    isPublicCurrentList,
    isJoinedCurrentList,
    canWriteToCurrentList,
    canJoinCurrentList,
    canLeaveCurrentList,
    mustLoginToJoin,
    showDirectJoinAction,
    canEditBirds,
    canStartEditBirds,
    canMakeChecklist,
  };
}

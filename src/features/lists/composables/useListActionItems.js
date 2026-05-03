import { computed } from "vue";

export function useListActionItems({
  listRef,
  t,
  permissions,
  notifications,
  isUpdatingVisibility,
}) {
  const listActionsInfoText = computed(() => {
    if (!permissions.isPublicCurrentList.value || permissions.canWriteToCurrentList.value) {
      return "";
    }

    return permissions.mustLoginToJoin.value ? t("Open_List_Login_Required") : t("Join_To_Contribute");
  });

  const listActionItems = computed(() => [
    {
      key: "share",
      label: t("Invite_A_Friend"),
      icon: "friends",
      visible: permissions.isListOwner.value,
    },
    {
      key: "copy-link",
      label: t("Copy_List_Link"),
      icon: "friends",
      visible: Boolean(listRef.value?.id),
    },
    {
      key: "subscribe",
      event: "toggle-notifications",
      label: notifications.isSubscribedToNotifications.value
        ? t("Disable_Notifications")
        : t("Enable_Notifications"),
      icon: notifications.isSubscribedToNotifications.value ? "bell-filled" : "bell",
      visible: Boolean(listRef.value?.id) && (
        permissions.isListOwner.value ||
        permissions.canWriteToCurrentList.value
      ) && notifications.hasLoadedNotificationStatus.value,
      disabled: notifications.isNotificationToggleBusy.value,
    },
    {
      key: "join",
      label: t("Join_List"),
      icon: "user",
      visible: permissions.canJoinCurrentList.value,
    },
    {
      key: "leave",
      label: t("Leave_List"),
      icon: "user",
      visible: permissions.canLeaveCurrentList.value,
    },
    {
      key: "login",
      label: t("Login_To_Join"),
      icon: "user",
      visible: permissions.mustLoginToJoin.value,
    },
    {
      key: "edit-list",
      label: t("Edit_List"),
      icon: "edit",
      visible: permissions.isListOwner.value,
    },
    {
      key: "toggle-edit-birds",
      label: t("Edit_Birds"),
      icon: "birds",
      visible: permissions.canStartEditBirds.value,
    },
    {
      key: "make-checklist",
      label: t("Save_As_Checklist"),
      icon: "check",
      visible: permissions.canMakeChecklist.value,
    },
    {
      key: "toggle-visibility",
      label: permissions.isPublicCurrentList.value ? t("Make_List_Private") : t("Make_List_Open"),
      icon: "view",
      visible: permissions.isListOwner.value && Boolean(listRef.value?.id),
      disabled: isUpdatingVisibility.value,
    },
    {
      key: "delete",
      event: "delete-list",
      label: t("Delete"),
      icon: "delete",
      visible: permissions.isListOwner.value && Boolean(listRef.value?.id),
      danger: true,
    },
  ]);

  return {
    listActionItems,
    listActionsInfoText,
  };
}

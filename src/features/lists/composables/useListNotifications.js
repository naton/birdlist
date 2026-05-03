import { ref } from "vue";
import { storeToRefs } from "pinia";
import {
  subscribeToListNotifications,
  unsubscribeFromListNotifications,
  isListNotificationsEnabled,
} from "@/helpers";
import { useSettingsStore } from "@/stores/settings.js";

export function useListNotifications(listRef, { isPremiumUser }) {
  const settingsStore = useSettingsStore();
  const { lang } = storeToRefs(settingsStore);

  const isSubscribedToNotifications = ref(false);
  const isNotificationToggleBusy = ref(false);
  const hasLoadedNotificationStatus = ref(false);
  let refreshRequestId = 0;

  async function refreshNotificationSubscriptionState() {
    const requestId = ++refreshRequestId;
    hasLoadedNotificationStatus.value = false;

    if (!listRef.value?.id || !isPremiumUser.value) {
      isSubscribedToNotifications.value = false;
      hasLoadedNotificationStatus.value = true;
      return;
    }

    const isEnabled = await isListNotificationsEnabled(listRef.value.id, lang.value);
    if (requestId !== refreshRequestId) {
      return;
    }

    isSubscribedToNotifications.value = isEnabled;
    hasLoadedNotificationStatus.value = true;
  }

  async function toggleListNotificationSubscription() {
    if (!listRef.value?.id || isNotificationToggleBusy.value) {
      return;
    }

    isNotificationToggleBusy.value = true;
    try {
      const didSucceed = isSubscribedToNotifications.value
        ? await unsubscribeFromListNotifications(listRef.value.id)
        : await subscribeToListNotifications(listRef.value.id, lang.value);

      if (didSucceed) {
        await refreshNotificationSubscriptionState();
        return;
      }

      await refreshNotificationSubscriptionState();
    } finally {
      isNotificationToggleBusy.value = false;
    }
  }

  return {
    isSubscribedToNotifications,
    isNotificationToggleBusy,
    hasLoadedNotificationStatus,
    refreshNotificationSubscriptionState,
    toggleListNotificationSubscription,
  };
}

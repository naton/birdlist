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

  async function refreshNotificationSubscriptionState() {
    if (!listRef.value?.id || !isPremiumUser.value) {
      isSubscribedToNotifications.value = false;
      return;
    }

    isSubscribedToNotifications.value = await isListNotificationsEnabled(listRef.value.id, lang.value);
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
    refreshNotificationSubscriptionState,
    toggleListNotificationSubscription,
  };
}

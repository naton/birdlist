const publicVapidKey = "BHzijUVWeXw8HDf3SQ3dLJiI-oW6FGtzY0j0CW1-cLGH_kv0n6Wm9rH341AtDi06uNrQe6PAE7GNnp_dUnPcoGY";
const apiHost =
  window.location.host.includes("localhost") || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : window.location.origin;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function normalizeListId(listId) {
  return String(listId ?? "").trim();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readApiResult(response, fallbackMessage) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.data?.success) {
    return {
      success: false,
      message: payload?.error?.message || fallbackMessage,
    };
  }

  return {
    success: true,
    data: payload.data,
  };
}

async function getPushRegistration() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  const existingRegistration = await navigator.serviceWorker.getRegistration();
  if (existingRegistration) {
    return existingRegistration;
  }

  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (error) {
    console.error("Failed to register service worker for push.", error);
    return null;
  }
}

async function getExistingPushSubscription() {
  const registration = await getPushRegistration();
  if (!registration) {
    return null;
  }

  return registration.pushManager.getSubscription();
}

async function ensurePushSubscription() {
  if (!("Notification" in window)) {
    return null;
  }

  const registration = await getPushRegistration();
  if (!registration) {
    return null;
  }

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

  if (permission !== "granted") {
    return null;
  }

  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    return existingSubscription;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
  });
}

async function subscribeToListNotifications(listId, language = "en") {
  const normalizedListId = normalizeListId(listId);
  if (!normalizedListId) {
    return false;
  }

  try {
    const subscription = await ensurePushSubscription();
    if (!subscription) {
      return false;
    }

    const response = await fetchWithTimeout(apiHost + "/api/subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listId: normalizedListId,
        subscription,
        language,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error subscribing to list notifications.", error);
    return false;
  }
}

async function unsubscribeFromListNotifications(listId) {
  const normalizedListId = normalizeListId(listId);
  if (!normalizedListId) {
    return false;
  }

  try {
    const subscription = await getExistingPushSubscription();
    if (!subscription) {
      return true;
    }

    const response = await fetchWithTimeout(apiHost + "/api/unsubscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        listId: normalizedListId,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    if (payload?.data?.remainingForEndpoint === 0) {
      await subscription.unsubscribe();
    }

    return true;
  } catch (error) {
    console.error("Error unsubscribing from list notifications.", error);
    return false;
  }
}

async function isListNotificationsEnabled(listId, language = "en") {
  const normalizedListId = normalizeListId(listId);
  if (!normalizedListId) {
    return false;
  }

  try {
    const subscription = await getExistingPushSubscription();
    if (!subscription) {
      return false;
    }

    const response = await fetchWithTimeout(apiHost + "/api/subscription-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        listId: normalizedListId,
        language,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    return Boolean(payload?.data?.subscribed);
  } catch (error) {
    console.error("Error reading list notification status.", error);
    return false;
  }
}

async function setListVisibility(listId, makePublic) {
  const normalizedListId = normalizeListId(listId);
  if (!normalizedListId) {
    return {
      success: false,
      message: "Missing list id.",
    };
  }

  try {
    const response = await fetchWithTimeout(apiHost + "/api/list-visibility", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listId: normalizedListId,
        makePublic: Boolean(makePublic),
      }),
    });

    return readApiResult(response, "Failed to update list visibility.");
  } catch (error) {
    console.error("Error updating list visibility.", error);
    return {
      success: false,
      message: "Network error while updating list visibility.",
    };
  }
}

async function leavePublicListRemotely(listId, ownerAliases = [], newOwner = "") {
  const normalizedListId = normalizeListId(listId);
  if (!normalizedListId) {
    return {
      success: false,
      message: "Missing list id.",
    };
  }

  try {
    const response = await fetchWithTimeout(apiHost + "/api/leave-public-list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listId: normalizedListId,
        ownerAliases,
        newOwner,
      }),
    });

    return readApiResult(response, "Failed to leave list.");
  } catch (error) {
    console.error("Error leaving public list.", error);
    return {
      success: false,
      message: "Network error while leaving list.",
    };
  }
}

async function deleteListRemotely(listId, deleteObservations) {
  const normalizedListId = normalizeListId(listId);
  if (!normalizedListId) {
    return {
      success: false,
      message: "Missing list id.",
    };
  }

  try {
    const response = await fetchWithTimeout(apiHost + "/api/delete-list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listId: normalizedListId,
        deleteObservations: Boolean(deleteObservations),
      }),
    });

    return readApiResult(response, "Failed to delete list.");
  } catch (error) {
    console.error("Error deleting list.", error);
    return {
      success: false,
      message: "Network error while deleting list.",
    };
  }
}

async function savePublicObservation(observation) {
  try {
    const response = await fetchWithTimeout(apiHost + "/api/public-observation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ observation }),
    });

    return readApiResult(response, "Failed to save observation.");
  } catch (error) {
    console.error("Error saving public observation.", error);
    return {
      success: false,
      message: "Network error while saving observation.",
    };
  }
}

async function getBirdDetails(latinName) {
  const normalizedLatinName = String(latinName || "").trim();
  if (!normalizedLatinName) {
    return {
      success: false,
      message: "Missing Latin name.",
    };
  }

  try {
    const response = await fetchWithTimeout(
      `${apiHost}/api/bird-details?latinName=${encodeURIComponent(normalizedLatinName)}`
    );
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.data?.success) {
      return {
        success: false,
        message: payload?.error?.message || "Failed to load bird details.",
      };
    }

    return {
      success: true,
      bird: payload.data.bird || null,
    };
  } catch (error) {
    console.error("Error loading bird details.", error);
    return {
      success: false,
      message: "Network error while loading bird details.",
    };
  }
}

async function getPublicListParticipants(listId) {
  const normalizedListId = normalizeListId(listId);
  if (!normalizedListId) {
    return {
      success: false,
      message: "Missing list id.",
    };
  }

  try {
    const response = await fetchWithTimeout(apiHost + "/api/public-list-participants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ listId: normalizedListId }),
    });

    return readApiResult(response, "Failed to load list participants.");
  } catch (error) {
    console.error("Error loading public list participants.", error);
    return {
      success: false,
      message: "Network error while loading list participants.",
    };
  }
}

function pushNewBirdAlert(msg) {
  return fetch(apiHost + "/api/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(msg),
  }).then((data) => console.log(data));
}
function getMonthName(month, length) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(month);
  return new Intl.DateTimeFormat("sv", {
    month: length ? "long" : "short",
  }).format(date);
}

function getCurrentYear(year) {
  const date = year ? new Date().setFullYear(year) : new Date();
  return new Intl.DateTimeFormat("sv", {
    year: "numeric",
  }).format(date);
}

function cssColor(string) {
  if (!string) return "";
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 3) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16) + "0";
  };

  return "#" + hashCode(string).substring(2, 8);
}

function isEmailLike(value) {
  const raw = String(value ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}

function toPublicUserLabel(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  if (!isEmailLike(raw)) {
    return raw;
  }

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }

  const suffix = hash.toString(16).toUpperCase().padStart(4, "0").slice(-4);
  return `Birder ${suffix}`;
}

function toSafeUserLabel(user, preferredLabel = user) {
  const raw = String(user ?? "").trim();
  const label = String(preferredLabel ?? "").trim();

  if (!raw) {
    return "";
  }

  if (label && label !== raw) {
    return label;
  }

  return toPublicUserLabel(raw);
}

function formatDate(date) {
  return new Intl.DateTimeFormat(false, {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatDateAndTime(date) {
  return new Intl.DateTimeFormat(false, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

function inputDate(date) {
  if (!date) {
    return;
  }

  return new Date(new Date(date).getTime() - new Date(date).getTimezoneOffset() * 60000).toISOString().substring(0, 10);
}

function inputDateTime(date) {
  if (!date) {
    return;
  }

  return new Date(new Date(date).getTime() - new Date(date).getTimezoneOffset() * 60000).toISOString().substring(0, 16);
}

function groupBy(objectArray, property) {
  return objectArray.reduce((acc, obj) => {
    const value = typeof property === "function" ? property(obj) : obj[property];
    const key =
      typeof value === "object"
        ? new Date(value).toISOString().slice(0, 10)
        : String(value || "").toLowerCase();
    if (!acc[key]) {
      acc[key] = [];
    }
    // Add object to list for given key's value
    acc[key].push(obj);
    return sortObject(acc);
  }, {});
}

function sortObject(o) {
  return Object.keys(o)
    .sort()
    .reduce((r, k) => ((r[k] = o[k]), r), {});
}

let newLeaderConfetti;

async function celebrate() {
  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  if (typeof newLeaderConfetti !== "undefined") {
    await newLeaderConfetti({
      angle: randomInRange(55, 105),
      spread: randomInRange(50, 70),
      particleCount: randomInRange(80, 120),
      origin: { y: 0.4 },
    });
  }
}

async function setupConfetti() {
  const canvas = document.getElementById("canvas");

  if (typeof confetti !== "undefined" && canvas) {
    /* eslint-disable-next-line */
    newLeaderConfetti = await confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });
  }
}

function destroyConfetti() {
  if (typeof newLeaderConfetti !== "undefined") {
    newLeaderConfetti.reset();
  }
}

export {
  subscribeToListNotifications,
  unsubscribeFromListNotifications,
  isListNotificationsEnabled,
  setListVisibility,
  leavePublicListRemotely,
  deleteListRemotely,
  savePublicObservation,
  getBirdDetails,
  getPublicListParticipants,
  pushNewBirdAlert,
  getMonthName,
  getCurrentYear,
  groupBy,
  cssColor,
  isEmailLike,
  toPublicUserLabel,
  toSafeUserLabel,
  formatDate,
  formatDateAndTime,
  inputDate,
  inputDateTime,
  celebrate,
  setupConfetti,
  destroyConfetti,
};



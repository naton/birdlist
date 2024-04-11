const publicVapidKey = "BHzijUVWeXw8HDf3SQ3dLJiI-oW6FGtzY0j0CW1-cLGH_kv0n6Wm9rH341AtDi06uNrQe6PAE7GNnp_dUnPcoGY";
const apiHost = document.location.host.includes('localhost') ? 'http://localhost:5001' : 'https://birdlist.app:443';

function askNotificationPermission(callback) {
  console.log("askNotificationPermission…")
  async function pushSubscribe(registration) {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicVapidKey,
    });
    // Send subscribe request
    await fetch(apiHost + "/api/subscription", {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: {
        "Content-Type": "application/json",
      }
    }).then(data => console.log(data))
  }

  // function to actually ask the permissions
  function handlePermission(permission) {
    console.log("handlePermission…")
    if (permission === "granted") {
      console.log("granted…")
      navigator.serviceWorker.ready.then((registration) => {
        if ("PushManager" in window) {
          console.log("PushManager available…")
          try {
            pushSubscribe(registration);
           } catch (error) {
            console.error("Error subscribing for push notifications.", error);
          }
        } else {
          console.error("PushManager not available.");
        }
      });

      if (typeof callback === "function") {
        callback();
      }
    }
  }

  function checkNotificationPromise() {
    try {
      Notification.requestPermission().then();
    } catch (e) {
      return false;
    }
  
    return true;
  }

  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications.");
  } else if (checkNotificationPromise()) {
    Notification.requestPermission().then((permission) => {
      handlePermission(permission);
    });
  } else {
    Notification.requestPermission((permission) => {
      handlePermission(permission);
    });
  }
}

function removePushManager(callback) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.pushManager.getSubscription().then((subscription) => {
      // Send subscribe request
      subscription.unsubscribe().then(() => {
        console.log("Unsubscribed from push notifications.");
        // You've successfully unsubscribed
        if (typeof callback === "function") {
          callback();
        }
      })
      .catch((e) => {
        console.error("Error unsubscribing from push notifications.", e);
      });
    });
  });
}

function pushNewBirdAlert(msg) {
  fetch(apiHost + "/api/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(msg)
  }).then(data => console.log(data))
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
    const key =
      typeof obj[property] === "object"
        ? new Date(obj[property]).toISOString().slice(0, 10)
        : obj[property].toLowerCase();
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
  askNotificationPermission,
  removePushManager,
  pushNewBirdAlert,
  getMonthName,
  getCurrentYear,
  groupBy,
  cssColor,
  formatDate,
  formatDateAndTime,
  inputDate,
  inputDateTime,
  celebrate,
  setupConfetti,
  destroyConfetti,
};

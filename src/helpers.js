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
  async function handlePermission(permission) {
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

async function removePushManager(callback) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.pushManager.getSubscription().then((subscription) => {
      // Send subscribe request
      subscription.unsubscribe().then((successful) => {
        // You've successfully unsubscribed
        if (typeof callback === "function") {
          callback();
        }
      })
      .catch((e) => {
        // Unsubscribing failed
      });
    });
  });
}

async function pushNewBirdAlert(msg) {
  await fetch(apiHost + "/api/push", {
    method: "POST",
    body: JSON.stringify(msg),
    headers: {
      "Content-Type": "application/json",
    }
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

export { askNotificationPermission, removePushManager, pushNewBirdAlert, getMonthName, getCurrentYear, cssColor, formatDate };

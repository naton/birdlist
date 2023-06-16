const publicVapidKey = "BC-q_Qa_xZrCippKmu2_x6oRsJFP7E9II66LbGAvhUc_Hw2Xe9pm6JJFEj_07OJzIcI4NjU4ovz8oOKb1jqPyhU";

function askNotificationPermission(callback) {
  async function pushSubscribe(registration) {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicVapidKey,
    });
    // Send subscribe request
    await fetch("//" + document.location.hostname + ":5001/api/subscription", {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: {
        "Content-Type": "application/json",
      }
    });
  }

  // function to actually ask the permissions
  async function handlePermission(permission) {
    if (permission === "granted") {
      navigator.serviceWorker.ready.then((registration) => {
        if ("PushManager" in window) {
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

export { askNotificationPermission, removePushManager, getMonthName, getCurrentYear, cssColor, formatDate };

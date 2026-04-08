function getIdleScheduler() {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback.bind(window);
  }

  return (callback) => setTimeout(callback, 150);
}

function scheduleRoutePrefetch(loaders, scheduler = getIdleScheduler()) {
  if (!Array.isArray(loaders) || loaders.length === 0) {
    return;
  }

  scheduler(() => {
    loaders.forEach((load) => {
      if (typeof load === "function") {
        Promise.resolve(load()).catch(() => null);
      }
    });
  });
}

export { getIdleScheduler, scheduleRoutePrefetch };

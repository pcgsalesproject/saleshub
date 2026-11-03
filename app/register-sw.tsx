"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Dev CSS/JS chunk names aren't content-hashed, so the worker's cache-first
    // strategy would keep serving stale styles. Remove any worker and its cache.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  }, []);

  return null;
}

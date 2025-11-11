"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    if (process.env.NEXT_PUBLIC_DISABLE_PWA === 'true') return;

    let refreshTriggered = false;

    const onControllerChange = () => {
      if (refreshTriggered) return;
      refreshTriggered = true;
      // Reload to ensure fresh runtime after new SW takes control
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    (async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        // Periodic update checks
        const interval = setInterval(() => {
          reg.update().catch(() => {});
        }, 30 * 60 * 1000);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              try { newWorker.postMessage({ type: 'SKIP_WAITING' }); } catch {}
            }
          });
        });

        // If waiting already exists, promote immediately
        if (reg.waiting) {
          try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch {}
        }

        return () => clearInterval(interval);
      } catch (err) {
        // silent fail by design
        console.warn('Service worker registration failed:', err);
      }
    })();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}

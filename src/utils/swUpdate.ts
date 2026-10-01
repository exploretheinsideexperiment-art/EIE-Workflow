/**
 * Service Worker Auto-Update and Cache Invalidation Utility
 * Ensures that when a new deployment is pushed to GitHub Pages,
 * browsers immediately download the latest code and reload smoothly.
 */

export function initServiceWorkerAutoUpdate() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  let refreshing = false;

  // When a new service worker takes over, reload the window to display the new update
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('[EIE PWA] New update activated, refreshing to display changes...');
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;

      // Check for updates on initial load
      registration.update().catch(() => {});

      // Check for updates whenever user tabs back into the web app
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      });

      // Periodically check for updates every 5 minutes
      setInterval(() => {
        registration.update().catch(() => {});
      }, 5 * 60 * 1000);

      // If there is already a waiting worker, tell it to skip waiting immediately
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // If a new worker is discovered installing
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available! Activate immediately
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });
    });
  });
}

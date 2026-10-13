/**
 * Service Worker & Version Auto-Update Utility
 * Detects when a new commit/build has been pushed and deployed to GitHub.
 * Displays a Pop-up modal with "Click here to update" so the user can easily
 * refresh and load the latest updates.
 */

// Global build time injected at build time by Vite, fallback to app start time
export const LOCAL_BUILD_TIME: number =
  typeof __APP_BUILD_TIME__ !== 'undefined'
    ? __APP_BUILD_TIME__
    : Date.now();

export interface VersionInfo {
  version: string;
  buildTime: number;
  builtAt?: string;
  buildId?: string;
}

type UpdateListener = (available: boolean, info: VersionInfo | null) => void;

class AppUpdateService {
  private updateAvailable = false;
  private versionInfo: VersionInfo | null = null;
  private waitingWorker: ServiceWorker | null = null;
  private listeners = new Set<UpdateListener>();
  private checkIntervalId: any = null;
  private isChecking = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // 1. Setup ServiceWorker detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          this.handleRegistration(registration);
        })
        .catch(() => {});

      navigator.serviceWorker.getRegistration()
        .then((registration) => {
          if (registration) {
            this.handleRegistration(registration);
          }
        })
        .catch(() => {});
    }

    // 2. Initial version.json check after 3 seconds
    setTimeout(() => {
      this.checkForUpdate();
    }, 3000);

    // 3. Periodic check every 25 seconds
    this.checkIntervalId = setInterval(() => {
      this.checkForUpdate();
    }, 25 * 1000);

    // 4. Check when user tabs back into the browser window
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdate();
      }
    });

    window.addEventListener('focus', () => {
      this.checkForUpdate();
    });
  }

  private handleRegistration(registration: ServiceWorkerRegistration) {
    if (!registration) return;

    // Check if a worker is already waiting
    if (registration.waiting) {
      this.waitingWorker = registration.waiting;
      this.triggerUpdateAvailable({
        version: '1.0.0',
        buildTime: Date.now(),
        builtAt: new Date().toISOString(),
      });
    }

    // Listen for incoming new worker installs
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New worker is ready and waiting for activation
            this.waitingWorker = installingWorker;
            this.triggerUpdateAvailable({
              version: '1.0.0',
              buildTime: Date.now(),
              builtAt: new Date().toISOString(),
            });
          }
        }
      });
    });

    // Check SW updates directly
    registration.update().catch(() => {});
  }

  /**
   * Check if a newer version has been deployed via version.json
   */
  public async checkForUpdate(): Promise<boolean> {
    if (this.isChecking) return this.updateAvailable;
    this.isChecking = true;

    try {
      // Also request service worker check if supported
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.update().catch(() => {});
        }).catch(() => {});
      }

      // Fetch version.json with aggressive cache-busting
      const timestamp = Date.now();
      const urlsToTry = [
        `./version.json?_t=${timestamp}`,
        `version.json?_t=${timestamp}`,
        `/version.json?_t=${timestamp}`
      ];

      for (const url of urlsToTry) {
        try {
          const res = await fetch(url, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
            cache: 'no-store',
          });

          if (res.ok) {
            const data: VersionInfo = await res.json();
            if (data && typeof data.buildTime === 'number') {
              // If remote build is newer than local build by more than 2 seconds
              if (data.buildTime > LOCAL_BUILD_TIME + 2000) {
                this.triggerUpdateAvailable(data);
                this.isChecking = false;
                return true;
              }
            }
          }
        } catch {
          // Continue to next URL attempt
        }
      }
    } catch {
      // Network or parse error, silently ignore
    } finally {
      this.isChecking = false;
    }

    return this.updateAvailable;
  }

  private triggerUpdateAvailable(info: VersionInfo) {
    this.updateAvailable = true;
    this.versionInfo = info;
    console.log('[EIE-Workflow] New version detected! Remote buildTime:', info.buildTime, 'Local buildTime:', LOCAL_BUILD_TIME);
    this.notifyListeners();
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    // Send current state immediately
    listener(this.updateAvailable, this.versionInfo);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.updateAvailable, this.versionInfo);
      } catch (err) {
        console.error('Error in update listener:', err);
      }
    });
  }

  /**
   * Called when user clicks "Click here to update"
   */
  public async applyUpdate(): Promise<void> {
    console.log('[EIE-Workflow] Applying update requested by user...');

    // 1. Tell waiting ServiceWorker to take over immediately
    if (this.waitingWorker) {
      try {
        this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      } catch (e) {
        console.warn('Could not post SKIP_WAITING to waiting worker:', e);
      }
    }

    // 2. Invalidate and purge browser CacheStorage to discard cached assets
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheNames = await window.caches.keys();
        await Promise.all(
          cacheNames.map((name) => window.caches.delete(name))
        );
        console.log('[EIE-Workflow] Cleared CacheStorage keys:', cacheNames);
      } catch (e) {
        console.warn('Could not delete CacheStorage:', e);
      }
    }

    // 3. Clear transient navigation sessionStorage flags
    try {
      sessionStorage.removeItem('eie_version_checked');
    } catch {
      // ignore
    }

    // 4. Force hard reload with timestamp parameter to bypass browser disk cache
    setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('_v', Date.now().toString());
        window.location.replace(url.toString());
      } catch {
        window.location.reload();
      }
    }, 150);
  }

  /**
   * Allows dismiss of the popup modal (can still be clicked from top bar badge)
   */
  public dismissModal() {
    // Keep updateAvailable = true, but components can control modal visibility
  }

  /**
   * Helper for manual testing in development or demonstration
   */
  public simulateUpdateForTesting() {
    this.triggerUpdateAvailable({
      version: '1.0.1 (New Push)',
      buildTime: Date.now() + 60000,
      builtAt: new Date().toISOString(),
      buildId: `bld_test_${Date.now()}`
    });
  }

  public getStatus() {
    return {
      updateAvailable: this.updateAvailable,
      versionInfo: this.versionInfo,
      localBuildTime: LOCAL_BUILD_TIME,
    };
  }
}

export const appUpdateService = new AppUpdateService();

/**
 * Legacy init function for compatibility
 */
export function initServiceWorkerAutoUpdate() {
  // appUpdateService initializes automatically
  return appUpdateService;
}

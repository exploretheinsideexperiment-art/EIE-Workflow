/**
 * Service Worker & Version Auto-Update Utility
 * Detects when a new commit/build has been pushed and deployed to GitHub.
 * Displays a Pop-up modal with "Click here to update" so the user can easily
 * refresh and load the latest updates.
 * Prevents loops: once updated or if current version is identical, no pop-up is shown.
 */

export const LOCAL_BUILD_TIME: number =
  typeof __APP_BUILD_TIME__ !== 'undefined'
    ? __APP_BUILD_TIME__
    : Date.now();

export const LOCAL_BUILD_ID: string =
  typeof __APP_BUILD_ID__ !== 'undefined'
    ? __APP_BUILD_ID__
    : `bld_${LOCAL_BUILD_TIME}`;

export interface VersionInfo {
  version: string;
  buildTime: number;
  builtAt?: string;
  buildId?: string;
  commit?: string;
}

type UpdateListener = (available: boolean, info: VersionInfo | null) => void;

const APPLIED_BUILD_ID_KEY = 'eie_applied_build_id';
const APPLIED_BUILD_TIME_KEY = 'eie_applied_build_time';
const DISMISSED_BUILD_ID_KEY = 'eie_dismissed_build_id';

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

    // Only enable periodic checks in production mode (e.g. GitHub Pages deploy),
    // to avoid disturbing local development with false alarms.
    const isDev = Boolean(import.meta.env?.DEV);
    if (!isDev) {
      // Initial check 5 seconds after page load
      setTimeout(() => {
        this.checkForUpdate();
      }, 5000);

      // Periodic check every 45 seconds for new GitHub pushes
      this.checkIntervalId = setInterval(() => {
        this.checkForUpdate();
      }, 45 * 1000);

      // Check when user returns to the tab
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkForUpdate();
        }
      });

      window.addEventListener('focus', () => {
        this.checkForUpdate();
      });
    }
  }

  private handleRegistration(registration: ServiceWorkerRegistration) {
    if (!registration) return;

    // Check if a worker is already waiting
    if (registration.waiting) {
      const alreadyApplied = this.isAlreadyApplied(null);
      if (alreadyApplied) {
        // User already updated; silently tell waiting worker to activate
        try {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } catch {}
      } else {
        this.waitingWorker = registration.waiting;
        // Verify with version.json before showing popup to avoid false alerts
        this.checkForUpdate();
      }
    }

    // Listen for incoming new worker installs
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            this.waitingWorker = installingWorker;
            this.checkForUpdate();
          }
        }
      });
    });

    // Check SW updates directly
    registration.update().catch(() => {});
  }

  /**
   * Check if a build was already applied by user
   */
  private isAlreadyApplied(remoteInfo: VersionInfo | null): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const appliedId = localStorage.getItem(APPLIED_BUILD_ID_KEY);
      const appliedTimeStr = localStorage.getItem(APPLIED_BUILD_TIME_KEY);
      const appliedTime = appliedTimeStr ? Number(appliedTimeStr) : 0;

      if (remoteInfo) {
        if (remoteInfo.buildId && appliedId === remoteInfo.buildId) {
          return true;
        }
        if (appliedTime > 0 && remoteInfo.buildTime <= appliedTime) {
          return true;
        }
      }
    } catch {}
    return false;
  }

  /**
   * Check if a newer version has been deployed via version.json
   */
  public async checkForUpdate(): Promise<boolean> {
    if (this.isChecking) return this.updateAvailable;
    this.isChecking = true;

    try {
      // Trigger service worker check if supported
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
              // 1. Is this exact build already the current local build?
              const isCurrentBuild =
                (data.buildId && data.buildId === LOCAL_BUILD_ID) ||
                (data.buildTime <= LOCAL_BUILD_TIME);

              if (isCurrentBuild) {
                // We are already running the latest deployed version!
                this.updateAvailable = false;
                this.versionInfo = data;
                this.notifyListeners();
                this.isChecking = false;
                return false;
              }

              // 2. Has the user already clicked update for this specific build?
              if (this.isAlreadyApplied(data)) {
                this.updateAvailable = false;
                this.versionInfo = data;
                this.notifyListeners();
                this.isChecking = false;
                return false;
              }

              // 3. New build confirmed!
              if (data.buildTime > LOCAL_BUILD_TIME || (data.buildId && data.buildId !== LOCAL_BUILD_ID)) {
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
    console.log('[EIE-Workflow] New version detected! Remote:', info.buildId, 'Local:', LOCAL_BUILD_ID);
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

    // 1. Mark this build as applied in localStorage so it NEVER shows pop-up again
    if (typeof window !== 'undefined') {
      try {
        if (this.versionInfo?.buildId) {
          localStorage.setItem(APPLIED_BUILD_ID_KEY, this.versionInfo.buildId);
        }
        if (this.versionInfo?.buildTime) {
          localStorage.setItem(APPLIED_BUILD_TIME_KEY, String(this.versionInfo.buildTime));
        }
      } catch {}
    }

    // Immediately reset state so UI removes the popup/banner
    this.updateAvailable = false;
    this.notifyListeners();

    // 2. Tell waiting ServiceWorker to take over immediately
    if (this.waitingWorker) {
      try {
        this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      } catch (e) {
        console.warn('Could not post SKIP_WAITING to waiting worker:', e);
      }
    }

    // Also tell all active/waiting service workers to skip waiting
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
          reg.update().catch(() => {});
        }
      } catch {}
    }

    // 3. Invalidate and purge browser CacheStorage to discard cached assets
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

    // 4. Clear transient navigation flags
    try {
      sessionStorage.removeItem(DISMISSED_BUILD_ID_KEY);
      sessionStorage.removeItem('eie_version_checked');
    } catch {}

    // 5. Force hard reload with timestamp parameter to bypass browser disk cache
    setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('_v', Date.now().toString());
        window.location.replace(url.toString());
      } catch {
        window.location.reload();
      }
    }, 200);
  }

  /**
   * Dismiss the pop-up for the current session/build
   */
  public dismissModal() {
    if (typeof window !== 'undefined' && this.versionInfo?.buildId) {
      try {
        sessionStorage.setItem(DISMISSED_BUILD_ID_KEY, this.versionInfo.buildId);
      } catch {}
    }
  }

  public isDismissedForCurrentBuild(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const dismissed = sessionStorage.getItem(DISMISSED_BUILD_ID_KEY);
      return Boolean(dismissed && dismissed === this.versionInfo?.buildId);
    } catch {
      return false;
    }
  }

  /**
   * Helper for manual testing in development or demonstration
   */
  public simulateUpdateForTesting() {
    const testId = `bld_test_${Date.now()}`;
    this.triggerUpdateAvailable({
      version: '1.0.1 (New Push)',
      buildTime: Date.now() + 60000,
      builtAt: new Date().toISOString(),
      buildId: testId,
      commit: 'test-push'
    });
  }

  public getStatus() {
    return {
      updateAvailable: this.updateAvailable,
      versionInfo: this.versionInfo,
      localBuildTime: LOCAL_BUILD_TIME,
      localBuildId: LOCAL_BUILD_ID,
    };
  }
}

export const appUpdateService = new AppUpdateService();

export function initServiceWorkerAutoUpdate() {
  return appUpdateService;
}

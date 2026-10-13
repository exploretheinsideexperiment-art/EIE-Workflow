import { useState, useEffect, useCallback } from 'react';
import { appUpdateService, VersionInfo, LOCAL_BUILD_TIME } from '../utils/swUpdate';

export function useAppUpdate() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(() => {
    return appUpdateService.getStatus().updateAvailable;
  });
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(() => {
    return appUpdateService.getStatus().versionInfo;
  });
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = appUpdateService.subscribe((available, info) => {
      setIsUpdateAvailable(available);
      setVersionInfo(info);
    });

    return unsubscribe;
  }, []);

  const handleApplyUpdate = useCallback(async () => {
    setIsApplying(true);
    await appUpdateService.applyUpdate();
  }, []);

  const handleCheckForUpdate = useCallback(async () => {
    setIsChecking(true);
    try {
      const hasUpdate = await appUpdateService.checkForUpdate();
      return hasUpdate;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleSimulateUpdate = useCallback(() => {
    appUpdateService.simulateUpdateForTesting();
  }, []);

  return {
    isUpdateAvailable,
    versionInfo,
    localBuildTime: LOCAL_BUILD_TIME,
    isChecking,
    isApplying,
    applyUpdate: handleApplyUpdate,
    checkForUpdate: handleCheckForUpdate,
    simulateUpdate: handleSimulateUpdate,
  };
}

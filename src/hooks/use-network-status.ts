'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineQueue } from '@/lib/offline-queue';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Update pending operations count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await offlineQueue.getOperationCount();
      setPendingCount(count);
    } catch {
      // Failed to get count, use 0 as fallback
    }
  }, []);

  useEffect(() => {
    // Initialize online status
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    // Network event handlers
    const handleOnline = () => {
      setIsOnline(true);
      updatePendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial pending count
    updatePendingCount();

    // Poll for pending count changes (for real-time updates)
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [updatePendingCount]);

  return {
    isOnline,
    pendingCount,
    refreshPendingCount: updatePendingCount,
  };
}

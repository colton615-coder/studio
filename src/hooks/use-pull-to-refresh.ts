import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { haptics } from '@/lib/haptics';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
  });

  const touchStartY = useRef<number>(0);
  const shouldReduceMotion = useReducedMotion();

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || state.isRefreshing) return;

      // Only trigger if scrolled to top
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
      }
    },
    [enabled, state.isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || state.isRefreshing || touchStartY.current === 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY.current;

      // Only allow pulling down
      if (distance > 0) {
        // Apply resistance curve (diminishing returns as you pull further)
        const pullDistance = Math.min(distance * 0.5, threshold * 1.5);

        setState((prev) => ({
          ...prev,
          isPulling: true,
          pullDistance,
        }));

        // Light haptic when crossing threshold
        if (pullDistance >= threshold && state.pullDistance < threshold) {
          haptics.light();
        }

        // Prevent default scroll behavior when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    },
    [enabled, state.isRefreshing, state.pullDistance, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || state.isRefreshing || touchStartY.current === 0) return;

    const shouldRefresh = state.pullDistance >= threshold;

    if (shouldRefresh) {
      // Trigger refresh
      setState((prev) => ({
        ...prev,
        isPulling: false,
        isRefreshing: true,
        pullDistance: threshold, // Lock at threshold during refresh
      }));

      // Medium haptic on refresh trigger
      haptics.medium();

      try {
        await onRefresh();
        // Success haptic
        haptics.success();
      } catch {
        // Error haptic
        haptics.error();
      } finally {
        // Reset state
        setState({
          isPulling: false,
          pullDistance: 0,
          isRefreshing: false,
        });
      }
    } else {
      // Reset without refreshing
      setState({
        isPulling: false,
        pullDistance: 0,
        isRefreshing: false,
      });
    }

    touchStartY.current = 0;
  }, [enabled, state.isRefreshing, state.pullDistance, threshold, onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    // Add passive: false to allow preventDefault
    const options: AddEventListenerOptions = { passive: false };

    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    ...state,
    threshold,
    shouldReduceMotion,
  };
}

import { useEffect, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  threshold?: number; // Distance in pixels to trigger refresh
}

export const usePullToRefresh = ({
  onRefresh,
  enabled = true,
  threshold = 80
}: UsePullToRefreshOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);
  const isRefreshingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop > 0 || isRefreshingRef.current) return;
      
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshingRef.current) return;

      currentYRef.current = e.touches[0].clientY;
      const pullDistance = currentYRef.current - startYRef.current;

      if (pullDistance > 0 && container.scrollTop === 0) {
        // Prevent default scrolling when pulling down
        e.preventDefault();
        
        // Add visual feedback
        const pullRatio = Math.min(pullDistance / threshold, 1);
        container.style.transform = `translateY(${pullDistance * 0.5}px)`;
        container.style.opacity = `${1 - pullRatio * 0.2}`;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;

      const pullDistance = currentYRef.current - startYRef.current;
      isPullingRef.current = false;

      // Reset transform
      container.style.transform = '';
      container.style.opacity = '';

      if (pullDistance >= threshold && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        try {
          await onRefresh();
        } finally {
          isRefreshingRef.current = false;
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onRefresh, threshold]);

  return containerRef;
};


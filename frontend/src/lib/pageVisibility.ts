// Page Visibility API utility for notification suppression

/**
 * Check if the page is currently visible
 */
export function isPageVisible(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  return !document.hidden && document.visibilityState === 'visible';
}

/**
 * Send visibility state to service worker
 */
export function updateServiceWorkerVisibility(isVisible: boolean): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'VISIBILITY_CHANGE',
      isVisible,
    });
  }
}

/**
 * Initialize visibility tracking and send updates to service worker
 */
export function initVisibilityTracking(): () => void {
  if (typeof document === 'undefined') {
    return () => {}; // No-op cleanup
  }

  // Send initial state
  updateServiceWorkerVisibility(isPageVisible());

  // Listen for visibility changes
  const handleVisibilityChange = () => {
    const visible = isPageVisible();
    updateServiceWorkerVisibility(visible);
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Also listen for focus/blur events as backup
  const handleFocus = () => updateServiceWorkerVisibility(true);
  const handleBlur = () => updateServiceWorkerVisibility(false);

  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);

  // Cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('blur', handleBlur);
  };
}



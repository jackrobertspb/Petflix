import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show prompt if user is logged in
      if (user) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [user]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    
    if (dontAskAgain) {
      // Permanently dismiss (store a very far future date)
      localStorage.setItem('pwa-prompt-dismissed', '9999999999999'); // Year 2286
      localStorage.setItem('pwa-prompt-permanent-dismiss', 'true');
    } else {
      // Store dismissal in localStorage to not show again for a while (7 days)
      localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    }
  };

  // Check if user dismissed recently (within 7 days) or permanently
  // Only show prompt if user is logged in
  useEffect(() => {
    // Don't show if user is not logged in
    if (!user) {
      setShowPrompt(false);
      return;
    }

    const permanentDismiss = localStorage.getItem('pwa-prompt-permanent-dismiss');
    if (permanentDismiss === 'true') {
      setShowPrompt(false);
      return;
    }

    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      // If it's the permanent dismiss marker (9999999999999) or within 7 days, don't show
      if (dismissedTime === 9999999999999 || (now - dismissedTime < sevenDays)) {
        setShowPrompt(false);
      } else if (deferredPrompt) {
        // If dismissed time has passed and we have a deferred prompt, show it
        setShowPrompt(true);
      }
    } else if (deferredPrompt) {
      // If never dismissed and we have a deferred prompt, show it
      setShowPrompt(true);
    }
  }, [user, deferredPrompt]);

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-in">
      <div className="bg-white dark:bg-petflix-dark rounded-lg shadow-2xl p-6 border-2 border-petflix-orange dark:border-petflix-orange">
        <div className="flex items-start gap-4">
          <svg className="w-8 h-8 text-petflix-orange flex-shrink-0" fill="currentColor" viewBox="0 0 512 512">
            <path d="M256 224c-79.41 0-192 122.76-192 200.25 0 34.9 26.81 55.75 71.74 55.75 48.84 0 81.09-25.08 120.26-25.08 39.51 0 71.85 25.08 120.26 25.08 44.93 0 71.74-20.85 71.74-55.75C448 346.76 335.41 224 256 224zm-147.28-12.61c-10.4-34.65-42.44-57.09-71.56-50.13-29.12 6.96-44.29 40.69-33.89 75.34 10.4 34.65 42.44 57.09 71.56 50.13 29.12-6.96 44.29-40.69 33.89-75.34zm84.72-20.78c30.94-8.14 46.42-49.94 34.58-93.36s-46.52-72.01-77.46-63.87-46.42 49.94-34.58 93.36c11.84 43.42 46.53 72.02 77.46 63.87zm281.39-29.34c-29.12-6.96-61.15 15.48-71.56 50.13-10.4 34.65 4.77 68.38 33.89 75.34 29.12 6.96 61.15-15.48 71.56-50.13 10.4-34.65-4.77-68.38-33.89-75.34zm-156.27 29.34c30.94 8.14 65.62-20.45 77.46-63.87 11.84-43.42-3.64-85.21-34.58-93.36s-65.62 20.45-77.46 63.87c-11.84 43.42 3.64 85.22 34.58 93.36z"/>
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-charcoal dark:text-white mb-2">
              Install Petflix
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Install Petflix on your device for quick access and a better experience!
            </p>
            
            {/* Don't Ask Again Checkbox */}
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="dont-ask-again"
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
                className="w-4 h-4 text-petflix-orange dark:text-petflix-orange bg-gray-100 dark:bg-petflix-gray border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange cursor-pointer"
              />
              <label
                htmlFor="dont-ask-again"
                className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none"
              >
                Don't ask me again
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 px-4 py-2 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded transition"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-gray-200 dark:bg-petflix-gray hover:bg-gray-300 dark:hover:bg-petflix-dark-gray text-charcoal dark:text-white font-medium rounded transition"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


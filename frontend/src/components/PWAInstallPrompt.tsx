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
      <div className="bg-white dark:bg-petflix-dark rounded-lg shadow-2xl p-6 border-2 border-lightblue dark:border-petflix-orange">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🐾</div>
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
                className="w-4 h-4 text-lightblue dark:text-petflix-orange bg-gray-100 dark:bg-petflix-gray border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange cursor-pointer"
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
                className="flex-1 px-4 py-2 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded transition"
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


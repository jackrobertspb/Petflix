import { api } from './api';

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  return await Notification.requestPermission();
}

/**
 * Convert VAPID public key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<void> {
  console.log('📱 [Push] Starting subscription process...');
  
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('❌ [Push] Browser not supported');
    throw new Error('Push notifications are not supported in this browser');
  }
  console.log('✅ [Push] Browser supports push notifications');

  // Check permission
  console.log('🔐 [Push] Current permission:', Notification.permission);
  
  if (Notification.permission === 'denied') {
    console.error('❌ [Push] Permission is BLOCKED');
    throw new Error(
      'Notifications are blocked. Click the lock icon 🔒 next to the URL → Site Settings → Notifications → Allow'
    );
  }

  // Request permission if not granted
  if (Notification.permission !== 'granted') {
    console.log('🔐 [Push] Requesting permission...');
    console.log('🔐 [Push] A popup should appear asking for notification permission');
    
    const permission = await requestNotificationPermission();
    console.log('🔐 [Push] Permission result:', permission);
    
    if (permission === 'denied') {
      console.error('❌ [Push] User clicked BLOCK');
      throw new Error(
        'You clicked "Block". To enable notifications, click the lock icon 🔒 next to the URL → Site Settings → Notifications → Allow, then try again.'
      );
    }
    
    if (permission !== 'granted') {
      console.error('❌ [Push] Permission not granted, got:', permission);
      throw new Error('Notification permission was not granted');
    }
  }
  console.log('✅ [Push] Permission granted');

  // Check if service worker is registered
  console.log('⚙️ [Push] Checking service worker status...');
  const existingRegistration = await navigator.serviceWorker.getRegistration();
  if (!existingRegistration) {
    console.error('❌ [Push] No service worker registered!');
    throw new Error('Service worker not registered. Please refresh the page and try again.');
  }
  console.log('✅ [Push] Service worker found:', existingRegistration.active?.state);

  // Get service worker registration
  console.log('⚙️ [Push] Waiting for service worker to be ready...');
  
  // Add timeout to prevent hanging forever
  const serviceWorkerTimeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Service worker timeout - took too long to be ready')), 10000);
  });
  
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    serviceWorkerTimeout
  ]);
  console.log('✅ [Push] Service worker ready:', registration);

  // Get VAPID public key from backend
  console.log('🔑 [Push] Fetching VAPID public key...');
  const response = await api.get('/push/public-key');
  const publicKey = response.data.publicKey;
  console.log('✅ [Push] Got public key:', publicKey?.substring(0, 20) + '...');
  
  if (!publicKey || publicKey.length < 80) {
    console.error('❌ [Push] Invalid VAPID public key:', publicKey);
    throw new Error('Invalid VAPID public key from server');
  }

  // Subscribe to push notifications
  console.log('📡 [Push] Subscribing to push manager...');
  console.log('📡 [Push] Application server key length:', publicKey.length);
  
  let applicationServerKey;
  try {
    applicationServerKey = urlBase64ToUint8Array(publicKey);
    console.log('✅ [Push] Converted key to Uint8Array, length:', applicationServerKey.length);
  } catch (conversionError) {
    console.error('❌ [Push] Failed to convert VAPID key:', conversionError);
    throw new Error('Failed to convert VAPID key format');
  }
  
  let subscription;
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    });
    console.log('✅ [Push] Push manager subscription created');
  } catch (subscribeError: any) {
    console.error('❌ [Push] Push manager subscription failed:', subscribeError);
    console.error('Error name:', subscribeError.name);
    console.error('Error message:', subscribeError.message);
    throw new Error(`Push subscription failed: ${subscribeError.message}`);
  }
  
  if (!subscription) {
    throw new Error('Subscription was not created properly');
  }

  // Send subscription to backend
  console.log('💾 [Push] Saving subscription to backend...');
  const subscriptionData = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
      auth: arrayBufferToBase64(subscription.getKey('auth')!),
    },
  };
  console.log('📤 [Push] Subscription data:', subscriptionData);
  
  await api.post('/push/subscribe', subscriptionData);
  console.log('✅ [Push] Subscription saved to backend');

  console.log('🎉 [Push] Successfully subscribed to push notifications');
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    // Unsubscribe from push manager
    await subscription.unsubscribe();

    // Remove subscription from backend
    await api.delete('/push/unsubscribe', {
      data: { endpoint: subscription.endpoint },
    });

    console.log('✅ Successfully unsubscribed from push notifications');
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error checking push subscription:', error);
    return false;
  }
}

/**
 * Helper function to convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export default {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushSubscribed,
};


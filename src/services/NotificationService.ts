// src/services/NotificationService.ts

export class NotificationService {
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    return await Notification.requestPermission();
  }

  static async subscribeUserToPush(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    const reg = await navigator.serviceWorker.ready;
    const permission = await NotificationService.requestPermission();
    if (permission !== 'granted') return null;
    // Replace with your VAPID public key
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    if (!vapidPublicKey) return null;
    const convertedVapidKey = NotificationService.urlBase64ToUint8Array(vapidPublicKey);
    return await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });
  }

  static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  static async showLocalNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }
}

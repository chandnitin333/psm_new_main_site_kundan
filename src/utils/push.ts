/**
 * PWA Web Push helper — lets a citizen subscribe their device so the gram
 * panchayat's new सूचना arrive as push notifications.
 */
import { postService } from '../services';

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
};

export const pushSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export const pushPermission = (): NotificationPermission | 'unsupported' =>
  pushSupported() ? Notification.permission : 'unsupported';

/** Is this device already subscribed for push? */
export const isPushSubscribed = async (): Promise<boolean> => {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
};

export interface EnableResult { ok: boolean; reason?: string; }

/** Request permission + subscribe this device, and register it with the backend. */
export const enablePush = async (): Promise<EnableResult> => {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, reason: 'denied' };

    const keyRes = await postService.getVapidKey();
    const publicKey = keyRes?.data?.public_key;
    if (!publicKey) return { ok: false, reason: 'no-key' };

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
    const res = await postService.subscribePush(sub.toJSON() as PushSubscriptionJSON);
    return { ok: !!res?.success };
  } catch (e) {
    return { ok: false, reason: (e as { message?: string })?.message || 'error' };
  }
};

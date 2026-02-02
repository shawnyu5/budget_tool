/**
 * Package for managing notifications
 */

import { loadServerConfig } from "./config";

/**
 * Get a notification subscription from the browser
 * @returns A push subscription if the user granted subscription access. Null otherwise
 */
export async function getNotificationSubscription(): Promise<PushSubscription | null> {
  if (!("Notification" in window)) {
    return null;
  }
  const result = await Notification.requestPermission();
  const serverConfig = await loadServerConfig();
  if (result === "granted") {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: serverConfig.vapidPublicKey,
    });
    return subscription;
  }

  return null;
}

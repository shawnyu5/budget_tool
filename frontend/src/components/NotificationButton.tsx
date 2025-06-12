import axios from "axios";
import { createResource, createSignal } from "solid-js";
import { loadLocalConfig, loadServerConfig } from "~/config";
import { paths } from "../backend_schema";

export default function NotificationButton() {
  const [permission, setPermission] = createSignal(Notification.permission);
  const [serverConfig] = createResource(loadServerConfig);

  async function requestPushPermission() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("Push notifications are not supported.");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: serverConfig()?.vapidPublicKey,
      });

      type RequestBody =
        paths["/notification/send"]["post"]["requestBody"]["content"]["application/json"];

      await axios.post<RequestBody>(
        `${loadLocalConfig().backendUrl}/notification/send`,
        subscription,
      );
    } else {
      console.warn("Permission denied for notifications.");
    }
  }

  return (
    <button
      onClick={requestPushPermission}
      // disabled={permission() === "granted"}
    >
      {permission() === "granted"
        ? "Notifications Enabled"
        : "Enable Notifications"}
    </button>
  );
}

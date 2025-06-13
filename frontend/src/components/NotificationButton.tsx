import axios from "axios";
import { createResource, createSignal } from "solid-js";
import { loadLocalConfig, loadServerConfig } from "~/config";
import { paths } from "../backend_schema";

export default function NotificationButton() {
  const [permission, setPermission] = createSignal(Notification.permission);
  const [serverConfig] = createResource(loadServerConfig);

  async function requestPushPermission() {
    console.log("HIII");
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

      console.log(JSON.stringify(subscription, null, 3));
      const body: RequestBody = {
        // @ts-ignore
        metaData: subscription.toJSON(),
        body: {
          title: "HIIII",
          body: "HELLOOOO",
        },
      };
      await axios.post<RequestBody>(
        `${loadLocalConfig().backendUrl}/notification/send`,
        body,
      );
      // await axios.post<RequestBody>(
      //   `${loadLocalConfig().backendUrl}/notification/send`,
      //   subscription,
      // );
    } else {
      console.warn("Permission denied for notifications.");
    }
  }

  // TODO: there should be a button or smth in settings, that shows the status of notification - enabled / disabled
  // If enabled, option to disable it
  // If disabled, option to enable, and prompt user for permission to send notifications
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

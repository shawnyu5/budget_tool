// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import { createResource } from "solid-js";
import { loadLocalConfig, loadServerConfig } from "./config";
import { paths } from "./backend_schema";
import axios from "axios";

/**
 * Request to send notifications to user
 */
async function requestPushPermission() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    alert("Push notifications are not supported. Ignore this...");
    return;
  }

  const result = await Notification.requestPermission();
  if (result === "granted") {
    // You can now subscribe with PushManager
    const reg = await navigator.serviceWorker.ready;
    const [serverConfig] = createResource(loadServerConfig);

    console.log(`public key: ${serverConfig()?.vapidPublicKey}`);
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: serverConfig()?.vapidPublicKey,
    });

    // Send `subscription` to your backend
    console.log("Push subscription:", JSON.stringify(subscription, null, 3));

    type RequestBody =
      paths["/notification/send"]["post"]["requestBody"]["content"]["application/json"];

    await axios.post<RequestBody>(
      `${loadLocalConfig().backendUrl}/notification/send`,
      subscription,
    );
  } else {
    alert("Permission denied for notifications.");
  }
}

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {
            // Have IOS treat this app as a native app, hide safari tab
          }
          <meta name="apple-mobile-web-app-capable" content="yes"></meta>
          {
            // Set app name on home page
          }
          <meta name="apple-mobile-web-app-title" content="Budget tool"></meta>

          {
            // Set IOS app icon
          }
          <link rel="apple-touch-icon" href="/logo.jpeg"></link>
          {
            // TODO: this startup image doesnt seem to show up for some reason
          }
          <link rel="apple-touch-startup-image" href="/logo.jpeg"></link>
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="black-translucent"
          ></meta>
          <link rel="icon" href="/favicon.ico" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));

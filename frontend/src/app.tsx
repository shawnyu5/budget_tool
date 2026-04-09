import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import Decimal from "decimal.js";
import { onMount, Suspense } from "solid-js";

export default function App() {
  onMount(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      console.error("Push notifications are not supported. Ignore this...");
      return;
    } else {
      console.log("Notifications supported in current context");
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistration("/sw.js")
        .then(async (reg) => {
          if (reg) {
            console.log(
              "Found previous registered service worker. Unregistering first",
            );
            await reg.unregister();
            return await navigator.serviceWorker.register("/sw.js");
          } else {
            console.log("Registering service worker");
            // No existing service worker, just register new one
            return navigator.serviceWorker.register("/sw.js");
          }
        })
        .then((reg) => {
          console.log("Service Worker registered at scope:", reg.scope);
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    } else {
      console.warn("Service worker not supported");
    }

    console.log(`Notification permission: ${Notification.permission}`);
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    } else {
      console.log(
        "Notification permission already set to:",
        Notification.permission,
      );
    }
  });

  Decimal.set({
    precision: 20,
    rounding: Decimal.ROUND_HALF_UP,
    toExpPos: 21,
  });
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/foundation-sites@6.9.0/dist/css/foundation.min.css"
            crossorigin="anonymous"
          ></link>
          <script
            src="https://cdn.jsdelivr.net/npm/foundation-sites@6.9.0/dist/js/foundation.min.js"
            crossorigin="anonymous"
          ></script>
          <Title>Budget tool</Title>
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}

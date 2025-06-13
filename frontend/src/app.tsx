import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { onMount, Suspense } from "solid-js";

export default function App() {
  onMount(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      console.error("Push notifications are not supported. Ignore this...");
      return;
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistration("/sw.js")
        .then(async (reg) => {
          if (reg) {
            await reg.unregister();
             console.log("unregister, then registering");
             return await navigator.serviceWorker.register("/sw.js");
          } else {
            console.log("Registered");
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
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/foundation-sites@6.8.1/dist/css/foundation.min.css"
            crossorigin="anonymous"
          ></link>
          <script
            src="https://cdn.jsdelivr.net/npm/foundation-sites@6.8.1/dist/js/foundation.min.js"
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

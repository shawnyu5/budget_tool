import { MetaProvider, Title } from "@solidjs/meta";
import { createAsync, Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { startMockWorker } from "./mocks/browser";

export default function App() {
  if (import.meta.env.VITE_E2E == "true") {
    startMockWorker();
  }

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
      {
        // <MonthlyBudgetProvider>
        // </MonthlyBudgetProvider>
      }
      <FileRoutes />
    </Router>
  );
}

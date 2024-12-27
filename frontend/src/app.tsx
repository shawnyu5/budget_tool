import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";

export default function App() {
  if (
    import.meta.env.MODE == "development" &&
    import.meta.env.VITE_E2E == "true"
  ) {
    import("./mocks/browser").then(({ worker }) => {
      worker.start();
    });
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

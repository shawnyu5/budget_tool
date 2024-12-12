import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import MonthsDropDown from "./components/monthsDropDown";
import { MonthlyBudgetProvider } from "./monthlyBudgetProvider";

export default function App() {
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
          {
            // <a href="/">Index</a>
            // <a href="/about">About</a>
          }
          <MonthsDropDown />
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

// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";
import log from "./logger";

async function startMock() {
  if (
    import.meta.env.MODE == "development" &&
    import.meta.env.VITE_E2E == "true"
  ) {
    try {
      log.info("Starting mock");
      log.info("trying to import worker");
      const { worker } = await import("~/mocks/browser");
      await worker.start();
    } catch (e) {
      log.error(`Failed to start mock workers: ${e}`);
    }
  }
}

startMock().then(() => {
  mount(() => <StartClient />, document.getElementById("app")!);
});

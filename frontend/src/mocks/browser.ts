import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Create a mock worker that will intercept the requests
export const worker = setupWorker(...handlers);

// Start the worker in the browser
export const startMockWorker = () => {
  worker.start();
};

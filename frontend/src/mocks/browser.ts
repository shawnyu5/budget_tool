import { setupWorker } from "msw/browser";
import { httpHandlers } from "./httpHandlers";
import { graphqlHandlers } from "./graphqlHandlers";

// Create a mock worker that will intercept the requests
export const worker = setupWorker(...httpHandlers, ...graphqlHandlers);


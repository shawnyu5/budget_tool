import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  define: {
    "import.meta.env": {
      VITE_BACKEND_URL: "https://mock-backend-url.com",
    },
  },
  // test: {
  //   environment: "jsdom",
  // },
  resolve: {
    conditions: ["development", "browser"],
    alias: {
      "~": "/src",
    },
  },
});

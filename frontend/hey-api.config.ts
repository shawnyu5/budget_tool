import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../backend/open_api_spec.json",
  output: "src/client",
  plugins: ["@hey-api/client-axios"],
});

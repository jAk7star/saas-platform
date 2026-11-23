import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../../services/core-jvm/dist/openapi-core.json",
  output: {
    path: "src/generated",
    postProcess: ["prettier"],
  },
  plugins: ["@hey-api/typescript", "@hey-api/sdk"],
});

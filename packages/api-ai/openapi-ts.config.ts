import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../../services/ai-etl/dist/openapi-ai.json",
  output: {
    path: "src/generated",
    postProcess: ["prettier"],
  },
  plugins: ["@hey-api/typescript", "@hey-api/sdk"],
});

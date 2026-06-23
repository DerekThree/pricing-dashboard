import { defineConfig } from "orval";

export default defineConfig({
  pricingApi: {
    input: "../pricing-backend/openapi.yaml",
    output: {
      target: "app/generated/api/client.ts",
      schemas: "app/generated/api/models",
      client: "fetch",
      baseUrl: {
        getBaseUrlFromSpecification: true,
      },
      override: {
        mutator: {
          path: "app/utils/apiMutator.ts",
          name: "apiMutator",
        },
      },
    },
  },
});

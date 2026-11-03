import { defineConfig } from "orval";

export default defineConfig({
  pricingApi: {
    input: "../pricing-backend/openapi.yaml",
    output: {
      target: "app/generated/backend/client.ts",
      schemas: "app/generated/backend/models",
      client: "fetch",
      baseUrl: "",
      override: {
        mutator: {
          path: "app/utils/apiMutator.ts",
          name: "backendMutator",
        },
      },
    },
  },
  accountProcessorApi: {
    input: "../pricing-mock-server/openapi.yaml",
    output: {
      target: "app/generated/accountProcessor/client.ts",
      schemas: "app/generated/accountProcessor/models",
      client: "fetch",
      baseUrl: "",
      override: {
        mutator: {
          path: "app/utils/apiMutator.ts",
          name: "accountProcessorMutator",
        },
      },
    },
  },
});

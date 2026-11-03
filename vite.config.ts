import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: ["VITE_", "BACKEND_API_URL", "ACCOUNT_PROCESSOR_API_URL"],
  plugins: [tailwindcss(), reactRouter()],

  optimizeDeps: {
    include: [
      "ag-grid-community",
      "ag-grid-react",
      "react-datepicker",
      "react-select",
    ],
  },

  resolve: {
    tsconfigPaths: true,
  },
});

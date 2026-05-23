import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/stateList.tsx", { id: "index" }),
  route("state", "routes/stateList.tsx"),
  route("state/crud/:operation", "routes/stateCrud.tsx"),
  route("region", "routes/regionList.tsx"),
  route("region/crud/:operation", "routes/regionCrud.tsx"),
  route("product", "routes/productList.tsx"),
  route("product/crud/:operation", "routes/productCrud.tsx"),
  route("schema/fee", "routes/feeList.tsx"),
  route("schema/rate", "routes/rateList.tsx"),
  route("simulator", "routes/simulator.tsx"),
] satisfies RouteConfig;

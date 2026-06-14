import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout/index.tsx", [
    index("routes/branches/list.tsx", { id: "index" }),
    route("branches", "routes/branches/list.tsx"),
    route("branches/:action/:id?", "routes/branches/crud.tsx"),
    route("regions", "routes/regions/list.tsx"),
    route("regions/:action/:id?", "routes/regions/crud.tsx"),
    route("products", "routes/products/list.tsx"),
    route("products/:action/:id?", "routes/products/crud.tsx"),
    route("pricing-plans", "routes/pricingPlans/list.tsx"),
    route("pricing-plans/:action/:id?", "routes/pricingPlans/crud.tsx"),
    route("simulator", "routes/simulator/index.tsx"),
  ]),
] satisfies RouteConfig;

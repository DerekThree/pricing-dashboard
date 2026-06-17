import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export const routeUrls = {
  branches: "/branches",
  regions: "/regions",
  products: "/products",
  pricingPlans: "/pricing-plans",
  simulator: "/simulator",
} as const;

export default [
  layout("routes/layout/index.tsx", [
    index("routes/branches/list.tsx", { id: "index" }),
    route("branches", "routes/branches/list.tsx"),
    route("branches/:operation/:id?", "routes/branches/crud.tsx"),
    route("regions", "routes/regions/list.tsx"),
    route("regions/:operation/:id?", "routes/regions/crud.tsx"),
    route("products", "routes/products/list.tsx"),
    route("products/:operation/:id?", "routes/products/crud.tsx"),
    route("pricing-plans", "routes/pricingPlans/list.tsx"),
    route("pricing-plans/:operation/:id?", "routes/pricingPlans/crud.tsx"),
    route("simulator", "routes/simulator/index.tsx"),
    route("*", "routes/notFound.tsx"),
  ]),
] satisfies RouteConfig;

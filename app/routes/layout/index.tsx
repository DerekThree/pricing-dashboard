import React from "react";
import { Outlet, useLocation, useNavigate, useNavigation } from "react-router";
import { isRouteErrorResponse } from "react-router";
import "./styles.css";
import ErrorPage from "../../components/ErrorPage";
import { routeUrls } from "../../routes";
import { ApiError } from "../../utils/apiUtils";
import type { Route } from "./+types";

type SidebarLink = {
  id: string;
  label: string;
  path: string;
  hasDividerBefore?: boolean;
};

function Sidebar() {
  const items: SidebarLink[] = [
    { id: "branches", label: "Branches", path: routeUrls.branches, hasDividerBefore: true },
    { id: "regions", label: "Regions", path: routeUrls.regions },
    { id: "products", label: "Products", path: routeUrls.products },
    { id: "pricing-plans", label: "Pricing Plans", path: routeUrls.pricingPlans },
    { id: "simulator", label: "Simulator", path: routeUrls.simulator, hasDividerBefore: true },
  ];
  const navigate = useNavigate();
  const loc = useLocation();
  const activePath = loc.pathname === "/" ? routeUrls.branches : loc.pathname;

  return (
    <aside className="layout-sidebar">
      <div className="layout-sidebar-brand">Welcome</div>
      <nav className="layout-sidebar-nav">
        {items.map((it) => (
          <div key={it.id}>
            {it.hasDividerBefore && <div className="layout-nav-divider" />}
            <button
              className={`layout-nav-button ${
                activePath === it.path ? "layout-nav-button-active" : ""
              }`}
              onClick={() => navigate(it.path)}
              type="button"
            >
              {it.label}
            </button>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function Layout({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  function handleHome() {
    navigate("/");
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        {isLoading && <div className="layout-loading-bar" />}
        <div className="layout-content">
          <div className="layout-header">
            <h1 className="layout-title">Pricing Dashboard</h1>
            <div className="ml-auto">
              <button className="layout-home-button" onClick={handleHome} type="button">
                Home
              </button>
            </div>
          </div>
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}

export default Layout;

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let status = "Error";
  let statusText = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    status = String(error.status);
    statusText =
      getString(error.data) ??
      (error.status === 404
        ? "The requested page could not be found."
        : error.statusText || statusText);
  } else if (error instanceof ApiError) {
    status = String(error.status);
    statusText = error.message;
    stack = import.meta.env.DEV ? error.stack : undefined;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    statusText = error.message;
    stack = error.stack;
  }

  return (
    <Layout>
      <ErrorPage stack={stack} status={status} statusText={statusText} />
    </Layout>
  );
}

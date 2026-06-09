import React from "react";
import { Outlet, useLocation, useNavigate, useNavigation } from "react-router";
import "./styles.css";

type SidebarLink = {
  id: string;
  label: string;
  path: string;
  hasDividerBefore?: boolean;
};

function Sidebar() {
  const items: SidebarLink[] = [
    { id: "branches", label: "Branches", path: "/branches", hasDividerBefore: true },
    { id: "regions", label: "Regions", path: "/regions" },
    { id: "products", label: "Products", path: "/products" },
    { id: "pricing-plans", label: "Pricing Plans", path: "/pricing-plans" },
    { id: "simulator", label: "Simulator", path: "/simulator", hasDividerBefore: true },
  ];
  const navigate = useNavigate();
  const loc = useLocation();
  const activePath = loc.pathname === "/" ? "/branches" : loc.pathname;

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

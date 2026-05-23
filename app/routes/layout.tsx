import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import "../styles/layout.css";

type SidebarLink = {
  id: string;
  label: string;
  path: string;
};

type SidebarGroup = {
  id: string;
  label: string;
  children: SidebarLink[];
};

type SidebarItem = SidebarLink | SidebarGroup;

function Sidebar() {
  const items: SidebarItem[] = [
    { id: "state", label: "State", path: "/state" },
    { id: "region", label: "Region", path: "/region" },
    { id: "product", label: "Product", path: "/product" },
    {
      id: "schema",
      label: "Schema",
      children: [
        { id: "schema/fee", label: "Fee", path: "/schema/fee" },
        { id: "schema/rate", label: "Rate", path: "/schema/rate" },
      ],
    },
    { id: "simulator", label: "Simulator", path: "/simulator" },
  ];
  const navigate = useNavigate();
  const loc = useLocation();
  const active = loc.pathname === "/" ? "state" : loc.pathname.replace(/^\//, "");
  const [openGroups, setOpenGroups] = React.useState<Set<string>>(
    () => new Set(active.startsWith("schema/") ? ["schema"] : []),
  );

  function toggleGroup(groupId: string) {
    setOpenGroups((currentGroups) => {
      const nextGroups = new Set(currentGroups);

      if (nextGroups.has(groupId)) {
        nextGroups.delete(groupId);
      } else {
        nextGroups.add(groupId);
      }

      return nextGroups;
    });
  }

  return (
    <aside className="layout-sidebar">
      <div className="layout-sidebar-brand">Welcome</div>
      <nav className="layout-sidebar-nav">
        {items.map((it) => (
          <div key={it.id}>
            {"children" in it ? (
              <>
                <button
                  aria-expanded={openGroups.has(it.id)}
                  className={`layout-nav-button layout-nav-group-button ${
                    active.startsWith(`${it.id}/`) ? "layout-nav-button-active" : ""
                  }`}
                  onClick={() => toggleGroup(it.id)}
                  type="button"
                >
                  <span>{it.label}</span>
                  <span className="layout-nav-group-icon">
                    {openGroups.has(it.id) ? "▾" : "▸"}
                  </span>
                </button>
                {openGroups.has(it.id) && (
                  <div className="layout-nav-sublist">
                    {it.children.map((child) => (
                      <button
                        key={child.id}
                        className={`layout-nav-button layout-nav-subbutton ${
                          active === child.id ? "layout-nav-button-active" : ""
                        }`}
                        onClick={() => navigate(child.path)}
                        type="button"
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button
                className={`layout-nav-button ${active === it.id ? "layout-nav-button-active" : ""}`}
                onClick={() => navigate(it.path)}
                type="button"
              >
                {it.label}
              </button>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function Layout({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();

  function handleHome() {
    navigate("/");
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
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

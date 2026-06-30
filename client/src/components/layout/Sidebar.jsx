import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  LayoutDashboard,
  Layers3,
  LogOut,
  Settings,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import api from "../../api/client";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/profile", icon: BarChart3, label: "Analytics" },
  { to: "/platforms", icon: Layers3, label: "Platforms" },
  { to: "/ai-mentor", icon: Bot, label: "AI Mentor", highlight: true },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data.user);
      } catch {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const username = user?.email?.split("@")[0] || "User";
  const email = user?.email || "";

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          ref={overlayRef}
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "sidebar",
          collapsed ? "sidebar--collapsed" : "",
          mobileOpen ? "sidebar--mobile-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Main navigation"
      >
        {/* ── Brand ── */}
        <div className="sidebar-brand">
          <NavLink to="/" className="sidebar-brand-link" title="Coding Dashboard">
            <span className="sidebar-brand-mark">
              <Grid2X2 size={20} />
            </span>
            {!collapsed && (
              <span className="sidebar-brand-name">
                Coding<span className="sidebar-brand-accent">Dashboard</span>
              </span>
            )}
          </NavLink>

          {/* Collapse toggle — desktop only */}
          <button
            className="sidebar-collapse-btn"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <ul className="sidebar-nav-list">
            {NAV_ITEMS.map(({ to, icon: Icon, label, end, highlight }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    [
                      "sidebar-nav-item",
                      isActive ? "sidebar-nav-item--active" : "",
                      highlight ? "sidebar-nav-item--highlight" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                  title={collapsed ? label : undefined}
                  onClick={onMobileClose}
                >
                  <span className="sidebar-nav-icon">
                    <Icon size={20} />
                  </span>
                  {!collapsed && (
                    <span className="sidebar-nav-label">{label}</span>
                  )}
                  {!collapsed && highlight && (
                    <span className="sidebar-nav-badge">AI</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Footer / User ── */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" aria-hidden="true">
              {username.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <strong className="sidebar-user-name">{username}</strong>
                <span className="sidebar-user-email">{email}</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={logout}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

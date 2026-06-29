import {
  Bell,
  Download,
  Menu,
  Moon,
  RefreshCw,
  Share2,
  Sun,
  User,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/client";

const PAGE_TITLES = {
  "/": { title: "Dashboard", subtitle: "Overview across all platforms" },
  "/profile": { title: "Analytics", subtitle: "Detailed performance breakdown" },
  "/platforms": { title: "Platforms", subtitle: "Manage connected accounts" },
  "/settings": { title: "Settings", subtitle: "Manage your preferences" },
  "/ai-mentor": { title: "AI Mentor", subtitle: "Your personal coding coach" },
};

const TopHeader = ({ onMobileMenuOpen, isDark, onThemeToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const dropdownRef = useRef(null);

  const pageKey = Object.keys(PAGE_TITLES)
    .filter((k) => k !== "/")
    .find((k) => location.pathname.startsWith(k)) || "/";
  const { title, subtitle } = PAGE_TITLES[pageKey] || PAGE_TITLES["/"];

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const username = user?.email?.split("@")[0] || "User";
  const email = user?.email || "";

  return (
    <>
      <header className="top-header">
        {/* Left: mobile hamburger + page title */}
        <div className="top-header-left">
          <button
            className="top-header-hamburger"
            onClick={onMobileMenuOpen}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          <div className="top-header-title">
            <h1 className="top-header-page-title">{title}</h1>
            <p className="top-header-page-sub">{subtitle}</p>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="top-header-actions">
          <button
            id="refresh-data-btn"
            className="header-action-btn"
            onClick={() => showToast("Data refreshed!")}
            aria-label="Refresh data"
            title="Refresh Data"
          >
            <RefreshCw size={17} />
            <span className="header-action-label">Refresh</span>
          </button>

          <button
            id="export-report-btn"
            className="header-action-btn"
            onClick={() => showToast("Report exported!")}
            aria-label="Export report"
            title="Export Report"
          >
            <Download size={17} />
            <span className="header-action-label">Export</span>
          </button>

          <button
            id="share-profile-btn"
            className="header-action-btn"
            onClick={() => showToast("Profile link copied!")}
            aria-label="Share profile"
            title="Share Profile"
          >
            <Share2 size={17} />
            <span className="header-action-label">Share</span>
          </button>

          <div className="header-divider" aria-hidden="true" />

          <button
            id="theme-toggle-btn"
            className="header-icon-btn"
            onClick={onThemeToggle}
            aria-label="Toggle theme"
            title="Toggle Theme"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            className="header-icon-btn header-notif-btn"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => showToast("No new notifications")}
          >
            <Bell size={17} />
          </button>

          {/* User profile dropdown */}
          <div className="header-profile-wrap" ref={dropdownRef}>
            <button
              id="user-profile-btn"
              className="header-profile-btn"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="User profile"
              aria-expanded={dropdownOpen}
            >
              <span className="header-avatar">
                {username.charAt(0).toUpperCase()}
              </span>
              <span className="header-username">{username}</span>
              <ChevronDown
                size={14}
                className={dropdownOpen ? "header-chevron--open" : ""}
              />
            </button>

            {dropdownOpen && (
              <div className="header-dropdown" role="menu">
                <div className="header-dropdown-info">
                  <span className="header-dropdown-name">{username}</span>
                  <span className="header-dropdown-email">{email}</span>
                </div>
                <div className="header-dropdown-divider" />
                <button
                  className="header-dropdown-item"
                  onClick={() => { setDropdownOpen(false); navigate("/settings"); }}
                  role="menuitem"
                >
                  <Settings size={15} />
                  Settings
                </button>
                <button
                  className="header-dropdown-item header-dropdown-item--danger"
                  onClick={logout}
                  role="menuitem"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Toast notification */}
      {toast && (
        <div className="header-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </>
  );
};

export default TopHeader;

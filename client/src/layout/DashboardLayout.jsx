import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import TopHeader from "../components/layout/TopHeader";
import { Footer } from "../components/Footer";

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.setAttribute(
        "data-theme",
        next ? "dark" : "light"
      );
      return next;
    });
  };

  return (
    <div
      className={[
        "app-shell-saas",
        sidebarCollapsed ? "app-shell-saas--collapsed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="app-content-area">
        <TopHeader
          onMobileMenuOpen={() => setMobileOpen(true)}
          isDark={isDark}
          onThemeToggle={toggleTheme}
        />

        <main className="app-main-saas">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;

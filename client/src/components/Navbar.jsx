import { BarChart3, Grid2X2, Layers3, LayoutDashboard, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/client";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/users/me");
        setUser(response.data.user);
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setUser(null);
      }
    };

    loadUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        <span className="brand-mark">
          <Grid2X2 size={24} />
        </span>
        <span>Coding Dashboard</span>
      </NavLink>

      <nav className="nav-links">
        <NavLink to="/" end>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/profile">
          <BarChart3 size={18} />
          Analytics
        </NavLink>
        <NavLink to="/platforms">
          <Layers3 size={18} />
          Platforms
        </NavLink>
      </nav>

      <div className="nav-user">
        <div>
          <strong>{user?.email?.split("@")[0] || "User"}</strong>
          <span>{user?.email || "Logged in"}</span>
        </div>
        <button className="icon-button" type="button" onClick={logout} aria-label="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;

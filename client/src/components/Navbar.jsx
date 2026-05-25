import { BarChart3, Grid2X2, Layers3, LayoutDashboard, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

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
        <NavLink to="/settings">
          <Layers3 size={18} />
          Platforms
        </NavLink>
      </nav>

      <div className="nav-user">
        <div>
          <strong>Student</strong>
          <span>Computer Science</span>
        </div>
        <button className="icon-button" type="button" onClick={logout} aria-label="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;

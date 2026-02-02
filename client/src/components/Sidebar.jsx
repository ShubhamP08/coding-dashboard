import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h1>CodeDash</h1>
      <NavLink to="/">Dashboard</NavLink><br />
      <NavLink to="/profile">Profile</NavLink>
      <NavLink to="/settings">Settings</NavLink>
    </div>
  );
};

export default Sidebar;

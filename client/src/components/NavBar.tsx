// ABOUTME: Primary navigation. Active link is marked for the current route.
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Recipes", end: true },
  { to: "/recipes/new", label: "Add Recipe" },
  { to: "/this-week", label: "This Week" },
  { to: "/groceries", label: "Groceries" },
  { to: "/settings", label: "Settings" },
];

export function NavBar() {
  return (
    <nav className="nav-bar" aria-label="Primary">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

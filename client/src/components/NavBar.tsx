import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Recipes", end: true },
  { to: "/add-recipe", label: "Add Recipe" },
  { to: "/groceries", label: "Groceries" },
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

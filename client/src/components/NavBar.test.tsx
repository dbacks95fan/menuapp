// ABOUTME: Establishes the client test pattern — render a component inside a
// ABOUTME: router, assert on accessible roles.
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { NavBar } from "./NavBar";

function renderNav(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <NavBar />
    </MemoryRouter>,
  );
}

describe("NavBar", () => {
  it("renders the three primary navigation links", () => {
    renderNav();
    expect(screen.getByRole("link", { name: "Recipes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add Recipe" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Groceries" })).toBeInTheDocument();
  });

  it("marks the link for the current route active", () => {
    renderNav("/groceries");
    expect(screen.getByRole("link", { name: "Groceries" })).toHaveClass("active");
    expect(screen.getByRole("link", { name: "Recipes" })).not.toHaveClass("active");
  });
});

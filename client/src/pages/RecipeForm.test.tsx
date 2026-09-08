// ABOUTME: RecipeForm — ingredient row add/remove and save validation.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createRecipe = vi.fn();
vi.mock("../lib/api", () => ({
  createRecipe: (...args: unknown[]) => createRecipe(...args),
  updateRecipe: vi.fn(),
  getRecipe: vi.fn(),
}));

import { RecipeForm } from "./RecipeForm";

function renderNew() {
  return render(
    <MemoryRouter initialEntries={["/recipes/new"]}>
      <Routes>
        <Route path="/recipes/new" element={<RecipeForm />} />
        <Route path="/recipes/:id" element={<div>saved recipe</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RecipeForm", () => {
  beforeEach(() => {
    createRecipe.mockReset();
  });

  it("adds and removes ingredient rows without touching the others", async () => {
    const user = userEvent.setup();
    renderNew();

    await user.type(screen.getByLabelText("Ingredient 1 name"), "flour");
    await user.click(screen.getByRole("button", { name: "Add ingredient" }));
    await user.type(screen.getByLabelText("Ingredient 2 name"), "sugar");

    await user.click(screen.getByRole("button", { name: "Remove ingredient 1" }));

    expect(screen.getByLabelText("Ingredient 1 name")).toHaveValue("sugar");
    expect(screen.queryByLabelText("Ingredient 2 name")).not.toBeInTheDocument();
  });

  it("refuses to save without a name", async () => {
    const user = userEvent.setup();
    renderNew();
    await user.type(screen.getByLabelText("Ingredient 1 name"), "flour");
    await user.click(screen.getByRole("button", { name: "Save recipe" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/name is required/i);
    expect(createRecipe).not.toHaveBeenCalled();
  });

  it("refuses to save without at least one ingredient", async () => {
    const user = userEvent.setup();
    renderNew();
    await user.type(screen.getByLabelText("Recipe name"), "Water");
    await user.click(screen.getByRole("button", { name: "Save recipe" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/at least one ingredient/i);
    expect(createRecipe).not.toHaveBeenCalled();
  });

  it("submits a structured payload and navigates to the saved recipe", async () => {
    createRecipe.mockResolvedValue({ id: 7 });
    const user = userEvent.setup();
    renderNew();

    await user.type(screen.getByLabelText("Recipe name"), "Toast");
    await user.type(screen.getByLabelText("Ingredient 1 name"), "bread");
    await user.type(screen.getByLabelText("Ingredient 1 quantity"), "2");
    await user.type(screen.getByLabelText("Ingredient 1 unit"), "slice");
    await user.click(screen.getByRole("button", { name: "Save recipe" }));

    expect(createRecipe).toHaveBeenCalledWith({
      name: "Toast",
      servings: null,
      tags: [],
      ingredients: [{ name: "bread", quantity: 2, unit: "slice", note: null }],
    });
    expect(await screen.findByText("saved recipe")).toBeInTheDocument();
  });
});

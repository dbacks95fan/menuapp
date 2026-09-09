// ABOUTME: ThisWeek — empty state, listing selections, remove, and clear.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listSelections = vi.fn();
const removeSelection = vi.fn();
const clearSelections = vi.fn();
vi.mock("../lib/api", () => ({
  listSelections: () => listSelections(),
  addSelection: vi.fn(),
  removeSelection: (id: number) => removeSelection(id),
  clearSelections: () => clearSelections(),
}));

import { ThisWeek } from "./ThisWeek";

const render_ = () =>
  render(
    <MemoryRouter>
      <ThisWeek />
    </MemoryRouter>,
  );

describe("ThisWeek", () => {
  beforeEach(() => {
    listSelections.mockReset();
    removeSelection.mockReset();
    clearSelections.mockReset();
  });

  it("explains how to select a recipe when the list is empty", async () => {
    listSelections.mockResolvedValue([]);
    render_();
    expect(await screen.findByText(/no recipes selected/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /library/i })).toBeInTheDocument();
  });

  it("lists selected recipes and removes one", async () => {
    listSelections.mockResolvedValue([
      { recipeId: 1, name: "Chili", servings: 4, ingredientCount: 6, addedAt: "" },
      { recipeId: 2, name: "Tacos", servings: null, ingredientCount: 5, addedAt: "" },
    ]);
    removeSelection.mockResolvedValue([
      { recipeId: 2, name: "Tacos", servings: null, ingredientCount: 5, addedAt: "" },
    ]);
    const user = userEvent.setup();
    render_();

    expect(await screen.findByRole("heading", { name: "Chili" })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(removeSelection).toHaveBeenCalledWith(1);
    expect(screen.queryByRole("heading", { name: "Chili" })).not.toBeInTheDocument();
  });

  it("clears the week only after confirmation", async () => {
    listSelections.mockResolvedValue([
      { recipeId: 1, name: "Chili", servings: 4, ingredientCount: 6, addedAt: "" },
    ]);
    clearSelections.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render_();

    await user.click(await screen.findByRole("button", { name: "Clear the week" }));
    expect(clearSelections).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(clearSelections).toHaveBeenCalledOnce();
  });
});

// ABOUTME: Groceries — combined amounts, pantry flag, and the hide-pantry view.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getGroceryList = vi.fn();
const listPantry = vi.fn();
const addPantryItem = vi.fn();
const removePantryItem = vi.fn();
vi.mock("../lib/api", () => ({
  getGroceryList: () => getGroceryList(),
  listPantry: () => listPantry(),
  addPantryItem: (name: string) => addPantryItem(name),
  removePantryItem: (id: number) => removePantryItem(id),
}));

import { Groceries } from "./Groceries";

const render_ = () =>
  render(
    <MemoryRouter>
      <Groceries />
    </MemoryRouter>,
  );

const line = (over: Record<string, unknown> = {}) => ({
  name: "flour",
  normalizedName: "flour",
  quantities: [{ quantity: 3, unit: "cup" }],
  contributions: [{ recipeId: 1, recipeName: "Bread", quantity: 3, unit: "cup" }],
  inPantry: false,
  ...over,
});

describe("Groceries", () => {
  beforeEach(() => {
    getGroceryList.mockReset();
    listPantry.mockReset();
    addPantryItem.mockReset();
    removePantryItem.mockReset();
    listPantry.mockResolvedValue([]);
  });

  it("prompts to select recipes when nothing is planned", async () => {
    getGroceryList.mockResolvedValue({ lines: [], recipeCount: 0 });
    render_();
    expect(await screen.findByText(/no recipes selected/i)).toBeInTheDocument();
  });

  it("shows combined amounts and provenance", async () => {
    getGroceryList.mockResolvedValue({ lines: [line()], recipeCount: 1 });
    render_();
    expect(await screen.findByText("flour")).toBeInTheDocument();
    expect(screen.getByText("3 cup")).toBeInTheDocument();
    expect(screen.getByText(/from Bread/)).toBeInTheDocument();
  });

  it("hides pantry items when the toggle is on", async () => {
    getGroceryList.mockResolvedValue({
      lines: [line(), line({ name: "salt", normalizedName: "salt", inPantry: true })],
      recipeCount: 1,
    });
    const user = userEvent.setup();
    render_();

    expect(await screen.findByText("salt")).toBeInTheDocument();
    await user.click(screen.getByLabelText(/hide items i already have/i));
    expect(screen.queryByText("salt")).not.toBeInTheDocument();
    expect(screen.getByText("flour")).toBeInTheDocument();
  });

  it("adds a line to the pantry", async () => {
    getGroceryList.mockResolvedValue({ lines: [line()], recipeCount: 1 });
    addPantryItem.mockResolvedValue([{ id: 9, name: "flour", normalizedName: "flour", createdAt: "" }]);
    const user = userEvent.setup();
    render_();

    await user.click(await screen.findByRole("button", { name: /i already have this/i }));
    expect(addPantryItem).toHaveBeenCalledWith("flour");
  });
});

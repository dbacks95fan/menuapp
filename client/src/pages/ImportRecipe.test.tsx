// ABOUTME: ImportRecipe — paste text produces a draft and hands off to review.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const importText = vi.fn();
const navigate = vi.fn();
vi.mock("../lib/api", () => ({
  importText: (t: string) => importText(t),
  importUrl: vi.fn(),
}));
vi.mock("../lib/extract-file", () => ({ extractTextFromFile: vi.fn() }));
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));

import { ImportRecipe } from "./ImportRecipe";

describe("ImportRecipe", () => {
  beforeEach(() => {
    importText.mockReset();
    navigate.mockReset();
  });

  it("extracts pasted text and navigates to review with the draft", async () => {
    const draft = { name: "Pasted Pie", servings: null, ingredients: [] };
    importText.mockResolvedValue(draft);
    const user = userEvent.setup();
    render(<ImportRecipe />);

    await user.type(screen.getByLabelText(/paste the recipe text/i), "Pasted Pie");
    await user.click(screen.getByRole("button", { name: /extract ingredients/i }));

    expect(importText).toHaveBeenCalledWith("Pasted Pie");
    expect(navigate).toHaveBeenCalledWith("/recipes/new", { state: { draft } });
  });

  it("surfaces an import error and does not navigate", async () => {
    importText.mockRejectedValue(new Error("Could not find a recipe on that page."));
    const user = userEvent.setup();
    render(<ImportRecipe />);

    await user.type(screen.getByLabelText(/paste the recipe text/i), "junk");
    await user.click(screen.getByRole("button", { name: /extract ingredients/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not find a recipe/i);
    expect(navigate).not.toHaveBeenCalled();
  });
});

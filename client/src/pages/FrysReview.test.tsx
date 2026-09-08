// ABOUTME: FrysReview — match listing, brand change persistence, cart report.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { api } = vi.hoisted(() => ({
  api: {
    getFrysMatch: vi.fn(),
    saveFrysMatch: vi.fn(),
    submitFrysCart: vi.fn(),
  },
}));
vi.mock("../lib/api", () => api);

import { FrysReview } from "./FrysReview";

const render_ = () =>
  render(
    <MemoryRouter>
      <FrysReview />
    </MemoryRouter>,
  );

const product = (id: string, brand: string, price: number) => ({
  productId: id,
  upc: `upc-${id}`,
  description: `${brand} rice`,
  brand,
  size: "1 lb",
  price,
  imageUrl: null,
});

describe("FrysReview", () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
  });

  it("shows the connection hint when matching is not ready", async () => {
    api.getFrysMatch.mockRejectedValue(new Error("Choose a Fry's store first."));
    render_();
    expect(await screen.findByRole("alert")).toHaveTextContent(/choose a fry.s store/i);
    expect(screen.getByRole("link", { name: /connection and store/i })).toBeInTheDocument();
  });

  it("lists matches with a total and persists a brand change", async () => {
    api.getFrysMatch.mockResolvedValue({
      currency: "USD",
      total: 3.49,
      lines: [
        {
          normalizedName: "rice",
          name: "rice",
          quantities: [{ quantity: 2, unit: "cup" }],
          neededQuantity: 1,
          remembered: false,
          chosen: product("a", "Brand A", 3.49),
          options: [product("a", "Brand A", 3.49), product("b", "Brand B", 4.19)],
          unmatched: false,
        },
      ],
    });
    api.saveFrysMatch.mockResolvedValue({});
    const user = userEvent.setup();
    render_();

    expect(await screen.findByText(/Estimated total: \$3\.49/)).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox"), "b");
    expect(api.saveFrysMatch).toHaveBeenCalledWith(
      "rice",
      expect.objectContaining({ productId: "b", brand: "Brand B" }),
    );
  });

  it("reports a partial cart failure without claiming full success", async () => {
    api.getFrysMatch.mockResolvedValue({
      currency: "USD",
      total: 3.49,
      lines: [
        {
          normalizedName: "rice",
          name: "rice",
          quantities: [],
          neededQuantity: 1,
          remembered: false,
          chosen: product("a", "Brand A", 3.49),
          options: [product("a", "Brand A", 3.49)],
          unmatched: false,
        },
      ],
    });
    api.submitFrysCart.mockResolvedValue({
      added: ["Brand A rice"],
      failed: [{ name: "Beans", reason: "invalid upc" }],
      allSucceeded: false,
    });
    const user = userEvent.setup();
    render_();

    await user.click(await screen.findByRole("button", { name: "Add to Fry’s" }));
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(/1 item added/i);
    expect(status).toHaveTextContent(/1 failed/i);
    expect(within(status).getByText(/Beans: invalid upc/)).toBeInTheDocument();
  });
});

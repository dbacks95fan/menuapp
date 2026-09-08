// ABOUTME: Settings — Fry's connect / configured states and store selection.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { api } = vi.hoisted(() => ({
  api: {
    getHousehold: vi.fn(),
    renameHousehold: vi.fn(),
    getFrysStatus: vi.fn(),
    getFrysAuthorizeUrl: vi.fn(),
    disconnectFrys: vi.fn(),
    findFrysLocations: vi.fn(),
    setFrysLocation: vi.fn(),
  },
}));
vi.mock("../lib/api", () => api);

import { Settings } from "./Settings";

const render_ = () =>
  render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
  );

describe("Settings", () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    api.getHousehold.mockResolvedValue({ name: "Home" });
  });

  it("says Fry's is not set up when the server has no credentials", async () => {
    api.getFrysStatus.mockResolvedValue({ configured: false, connected: false });
    render_();
    expect(await screen.findByText(/isn.t set up on this server/i)).toBeInTheDocument();
  });

  it("offers to connect when configured but not connected", async () => {
    api.getFrysStatus.mockResolvedValue({ configured: true, connected: false });
    render_();
    expect(await screen.findByRole("button", { name: /connect fry/i })).toBeInTheDocument();
  });

  it("finds and selects a home store when connected", async () => {
    api.getFrysStatus.mockResolvedValue({
      configured: true,
      connected: true,
      connectedAt: null,
      locationId: null,
      locationName: null,
    });
    api.findFrysLocations.mockResolvedValue([
      { locationId: "700", name: "Fry's Central", address: "1 Main St" },
    ]);
    api.setFrysLocation.mockResolvedValue({});
    const user = userEvent.setup();
    render_();

    await user.type(await screen.findByLabelText("ZIP code"), "85001");
    await user.click(screen.getByRole("button", { name: "Find stores" }));
    await user.click(await screen.findByRole("button", { name: "Use this store" }));

    expect(api.setFrysLocation).toHaveBeenCalledWith("700", "Fry's Central");
  });
});

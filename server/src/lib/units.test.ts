// ABOUTME: Tests for unit normalization and compatibility-aware quantity math.
import { describe, expect, it } from "vitest";
import { addCompatible, areCompatible, normalizeUnit, unitFamily } from "./units.js";

describe("normalizeUnit", () => {
  it("maps aliases and plurals to a canonical unit", () => {
    expect(normalizeUnit("Cups")).toBe("cup");
    expect(normalizeUnit("tablespoons")).toBe("tbsp");
    expect(normalizeUnit("tsp.")).toBe("tsp");
    expect(normalizeUnit("Grams")).toBe("g");
    expect(normalizeUnit("cloves")).toBe("clove");
  });

  it("returns null for empty input and passes through unknown units lowercased", () => {
    expect(normalizeUnit("")).toBeNull();
    expect(normalizeUnit(null)).toBeNull();
    expect(normalizeUnit("splash")).toBe("splash");
  });
});

describe("areCompatible", () => {
  it("treats units in the same measurement family as compatible", () => {
    expect(areCompatible("cup", "tbsp")).toBe(true);
    expect(areCompatible("g", "kg")).toBe(true);
  });

  it("treats different families / unknown units as incompatible unless identical", () => {
    expect(areCompatible("cup", "g")).toBe(false);
    expect(areCompatible("clove", "can")).toBe(false);
    expect(areCompatible("clove", "clove")).toBe(true);
    expect(areCompatible(null, null)).toBe(true);
    expect(areCompatible(null, "cup")).toBe(false);
  });
});

describe("unitFamily", () => {
  it("classifies volume and mass units", () => {
    expect(unitFamily("cup")).toBe("volume");
    expect(unitFamily("lb")).toBe("mass");
    expect(unitFamily("clove")).toBeNull();
    expect(unitFamily(null)).toBeNull();
  });
});

describe("addCompatible", () => {
  it("sums same-unit quantities", () => {
    expect(addCompatible([{ quantity: 1, unit: "cup" }, { quantity: 2, unit: "cup" }])).toEqual({
      quantity: 3,
      unit: "cup",
    });
  });

  it("converts within a family to the first unit seen", () => {
    // 1 cup + 4 tbsp = 1.25 cup
    const out = addCompatible([{ quantity: 1, unit: "cup" }, { quantity: 4, unit: "tbsp" }]);
    expect(out.unit).toBe("cup");
    expect(out.quantity).toBeCloseTo(1.25, 2);
  });

  it("sums bare counts with no unit", () => {
    expect(addCompatible([{ quantity: 2, unit: null }, { quantity: 3, unit: null }])).toEqual({
      quantity: 5,
      unit: null,
    });
  });

  it("keeps the unit but drops the total when any quantity is missing", () => {
    expect(addCompatible([{ quantity: null, unit: "clove" }, { quantity: 2, unit: "clove" }])).toEqual({
      quantity: null,
      unit: "clove",
    });
  });
});

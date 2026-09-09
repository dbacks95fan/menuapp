import { expect, test } from "@playwright/test";
import { createRecipe, resetApp } from "../helpers";

test.beforeEach(async ({ request }) => resetApp(request));

test("combined grocery list sums shared ingredients and hides pantry items", async ({ page }) => {
  await createRecipe(
    page,
    "Grocery Bread",
    [
      { name: "flour", qty: "2", unit: "cups" },
      { name: "salt", qty: "1", unit: "tsp" },
    ],
    { addToWeek: true },
  );
  await createRecipe(
    page,
    "Grocery Cake",
    [
      { name: "Flour", qty: "1", unit: "cup" },
      { name: "sugar", qty: "1", unit: "cup" },
    ],
    { addToWeek: true },
  );

  await page.getByRole("link", { name: "Groceries" }).click();

  const flourRow = page.locator(".card", { hasText: "flour" });
  await expect(flourRow.getByText("3 cup")).toBeVisible();
  await expect(flourRow.getByText(/from Grocery Bread, Grocery Cake/)).toBeVisible();

  await page
    .locator(".card", { hasText: "salt" })
    .getByRole("button", { name: /i already have this/i })
    .click();
  await expect(
    page.locator(".card", { hasText: "salt" }).getByRole("button", { name: /already have/i }),
  ).toBeVisible();

  await page.getByLabel(/hide items i already have/i).check();
  await expect(page.locator(".card", { hasText: "salt" })).toHaveCount(0);
  await expect(page.locator(".card", { hasText: "flour" })).toBeVisible();
});

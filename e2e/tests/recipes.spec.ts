import { expect, test } from "@playwright/test";

test("creating a recipe shows it in the library and groceries list", async ({ page }) => {
  await page.goto("/add-recipe");

  await page.getByLabel("Recipe name").fill("Playwright Pancakes");
  await page.getByLabel("Ingredients (one per line)").fill("flour\neggs\nmilk");
  await page.getByRole("button", { name: "Save recipe" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Playwright Pancakes" })).toBeVisible();

  await page.getByRole("link", { name: "Groceries" }).click();
  await expect(page.getByText("flour")).toBeVisible();
  await expect(page.getByText("eggs")).toBeVisible();
  await expect(page.getByText("milk")).toBeVisible();
});

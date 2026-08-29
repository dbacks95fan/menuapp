import { expect, test } from "@playwright/test";

test("creating a recipe shows it in the library and groceries list", async ({ page }) => {
  // With no recipes yet, the library shows a friendly empty state (AC1) with a
  // call to action that navigates to the Add Recipe page (AC2).
  await page.goto("/");
  await expect(page.getByText(/no recipes|recipe library is empty/i)).toBeVisible();
  const addFirstRecipe = page.getByRole("link", { name: /add (your )?first recipe/i });
  await expect(addFirstRecipe).toBeVisible();
  await addFirstRecipe.click();
  await expect(page).toHaveURL(/\/add-recipe$/);

  await page.getByLabel("Recipe name").fill("Playwright Pancakes");
  await page.getByLabel("Ingredients (one per line)").fill("flour\neggs\nmilk");
  await page.getByRole("button", { name: "Save recipe" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Playwright Pancakes" })).toBeVisible();

  // Once a recipe exists, the empty state and its call to action are gone (AC3).
  await expect(page.getByText(/recipe library is empty/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /add (your )?first recipe/i })).toHaveCount(0);

  await page.getByRole("link", { name: "Groceries" }).click();
  await expect(page.getByText("flour")).toBeVisible();
  await expect(page.getByText("eggs")).toBeVisible();
  await expect(page.getByText("milk")).toBeVisible();
});

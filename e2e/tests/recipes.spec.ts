import { expect, test } from "@playwright/test";

test("create, view, edit, and delete a recipe with structured ingredients", async ({ page }) => {
  // Empty library -> call to action.
  await page.goto("/");
  await expect(page.getByText(/recipe library is empty/i)).toBeVisible();
  await page.getByRole("link", { name: /add (your )?first recipe/i }).click();
  await expect(page).toHaveURL(/\/recipes\/new$/);

  // Fill the form: name, servings, two ingredient rows.
  await page.getByLabel("Recipe name").fill("Playwright Pancakes");
  await page.getByLabel("Servings (optional)").fill("4");
  await page.getByLabel("Ingredient 1 name").fill("flour");
  await page.getByLabel("Ingredient 1 quantity").fill("2");
  await page.getByLabel("Ingredient 1 unit").fill("cups");
  await page.getByRole("button", { name: "Add ingredient" }).click();
  await page.getByLabel("Ingredient 2 name").fill("eggs");
  await page.getByLabel("Ingredient 2 quantity").fill("2");
  await page.getByRole("button", { name: "Save recipe" }).click();

  // Lands on the detail page.
  await expect(page.getByRole("heading", { name: "Playwright Pancakes" })).toBeVisible();
  await expect(page.getByText(/2 cup flour/)).toBeVisible();
  await expect(page.getByText(/2 eggs/)).toBeVisible();

  // Shows up in the library; empty state gone.
  await page.getByRole("link", { name: "Recipes" }).click();
  await expect(page.getByRole("heading", { name: "Playwright Pancakes" })).toBeVisible();
  await expect(page.getByText(/recipe library is empty/i)).toHaveCount(0);

  // Edit it.
  await page.getByRole("heading", { name: "Playwright Pancakes" }).click();
  await page.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Recipe name").fill("Playwright Waffles");
  await page.getByRole("button", { name: "Save recipe" }).click();
  await expect(page.getByRole("heading", { name: "Playwright Waffles" })).toBeVisible();

  // Delete it, with confirmation.
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete" }).click(); // confirm
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(/recipe library is empty/i)).toBeVisible();
});

import { expect, test } from "@playwright/test";

async function addRecipe(page: import("@playwright/test").Page, name: string, ingredient: string) {
  await page.goto("/recipes/new");
  await page.getByLabel("Recipe name").fill(name);
  await page.getByLabel("Ingredient 1 name").fill(ingredient);
  await page.getByRole("button", { name: "Save recipe" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

test("select recipes for the week, view them, remove one, clear the rest", async ({ page }) => {
  await addRecipe(page, "Weekly Chili", "beans");
  await addRecipe(page, "Weekly Tacos", "tortillas");

  // Select both from the library.
  await page.goto("/");
  const chili = page.locator(".card", { hasText: "Weekly Chili" });
  const tacos = page.locator(".card", { hasText: "Weekly Tacos" });
  await chili.getByRole("button", { name: "Add to this week" }).click();
  await expect(chili.getByRole("button", { name: /In this week/ })).toBeVisible();
  await tacos.getByRole("button", { name: "Add to this week" }).click();

  // This Week shows both.
  await page.getByRole("link", { name: "This Week" }).click();
  await expect(page.getByRole("heading", { name: "Weekly Chili" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Weekly Tacos" })).toBeVisible();

  // Remove one.
  await page
    .locator(".card", { hasText: "Weekly Chili" })
    .getByRole("button", { name: "Remove" })
    .click();
  await expect(page.getByRole("heading", { name: "Weekly Chili" })).toHaveCount(0);

  // Clear the rest, with confirmation.
  await page.getByRole("button", { name: "Clear the week" }).click();
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByText(/no recipes selected/i)).toBeVisible();
});

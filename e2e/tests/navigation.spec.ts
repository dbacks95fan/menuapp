import { expect, test } from "@playwright/test";

test.describe("navigation", () => {
  test("moves between every primary section and marks the active one", async ({ page }) => {
    await page.goto("/");

    const recipesLink = page.getByRole("link", { name: "Recipes" });
    const addRecipeLink = page.getByRole("link", { name: "Add Recipe" });
    const groceriesLink = page.getByRole("link", { name: "Groceries" });

    await expect(recipesLink).toHaveClass(/active/);

    await addRecipeLink.click();
    await expect(page).toHaveURL(/\/add-recipe$/);
    await expect(addRecipeLink).toHaveClass(/active/);
    await expect(recipesLink).not.toHaveClass(/active/);

    await groceriesLink.click();
    await expect(page).toHaveURL(/\/groceries$/);
    await expect(groceriesLink).toHaveClass(/active/);

    await recipesLink.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(recipesLink).toHaveClass(/active/);
  });

  test("retains the current route on refresh", async ({ page }) => {
    await page.goto("/groceries");
    await page.reload();
    await expect(page).toHaveURL(/\/groceries$/);
    await expect(page.getByRole("link", { name: "Groceries" })).toHaveClass(/active/);
  });

  test("navigation works at mobile viewport size", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.getByRole("link", { name: "Add Recipe" }).click();
    await expect(page).toHaveURL(/\/add-recipe$/);
  });
});

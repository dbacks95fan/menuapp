import { expect, test } from "@playwright/test";
import { createRecipe, resetApp } from "../helpers";

test.beforeEach(async ({ request }) => resetApp(request));

test("select recipes for the week, view them, remove one, clear the rest", async ({ page }) => {
  await createRecipe(page, "Weekly Chili", [{ name: "beans" }]);
  await createRecipe(page, "Weekly Tacos", [{ name: "tortillas" }]);

  await page.goto("/");
  const chili = page.locator(".card", { hasText: "Weekly Chili" });
  const tacos = page.locator(".card", { hasText: "Weekly Tacos" });
  await chili.getByRole("button", { name: "Add to this week" }).click();
  await expect(chili.getByRole("button", { name: /In this week/ })).toBeVisible();
  await tacos.getByRole("button", { name: "Add to this week" }).click();

  await page.getByRole("link", { name: "This Week" }).click();
  await expect(page.getByRole("heading", { name: "Weekly Chili" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Weekly Tacos" })).toBeVisible();

  await page
    .locator(".card", { hasText: "Weekly Chili" })
    .getByRole("button", { name: "Remove" })
    .click();
  await expect(page.getByRole("heading", { name: "Weekly Chili" })).toHaveCount(0);

  await page.getByRole("button", { name: "Clear the week" }).click();
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByText(/no recipes selected/i)).toBeVisible();
});

// ABOUTME: Shared helpers for e2e specs — reset the app's data and create a
// ABOUTME: recipe through the UI.
import { expect, type APIRequestContext, type Page } from "@playwright/test";

export async function resetApp(request: APIRequestContext): Promise<void> {
  const res = await request.post("/api/test/reset");
  expect(res.ok()).toBeTruthy();
}

export interface RecipeRow {
  name: string;
  qty?: string;
  unit?: string;
}

export async function createRecipe(
  page: Page,
  name: string,
  rows: RecipeRow[],
  { addToWeek = false }: { addToWeek?: boolean } = {},
): Promise<void> {
  await page.goto("/recipes/new");
  await page.getByLabel("Recipe name").fill(name);
  for (let i = 0; i < rows.length; i += 1) {
    if (i > 0) await page.getByRole("button", { name: "Add ingredient" }).click();
    await page.getByLabel(`Ingredient ${i + 1} name`).fill(rows[i].name);
    if (rows[i].qty) await page.getByLabel(`Ingredient ${i + 1} quantity`).fill(rows[i].qty!);
    if (rows[i].unit) await page.getByLabel(`Ingredient ${i + 1} unit`).fill(rows[i].unit!);
  }
  await page.getByRole("button", { name: "Save recipe" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  if (addToWeek) {
    await page.getByRole("button", { name: "Add to this week" }).click();
  }
}

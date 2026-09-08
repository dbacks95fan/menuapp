// ABOUTME: Typed wrappers around the MealFlow JSON API. Pages call these, never
// ABOUTME: fetch() directly.

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function empty(res: Response): Promise<void> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
}

const jsonHeaders = { "Content-Type": "application/json" };

export interface Ingredient {
  id: number;
  position: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  raw: string | null;
}

export interface IngredientInput {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  note?: string | null;
  raw?: string;
}

export interface RecipeSummary {
  id: number;
  name: string;
  servings: number | null;
  tags: string[];
  ingredientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  id: number;
  name: string;
  servings: number | null;
  tags: string[];
  ingredients: Ingredient[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeInput {
  name: string;
  servings?: number | null;
  tags?: string[];
  ingredients: IngredientInput[];
}

export interface Selection {
  recipeId: number;
  name: string;
  servings: number | null;
  ingredientCount: number;
  addedAt: string;
}

export interface GroceryQuantity {
  quantity: number | null;
  unit: string | null;
}

export interface GroceryContribution {
  recipeId: number;
  recipeName: string;
  quantity: number | null;
  unit: string | null;
}

export interface GroceryLine {
  name: string;
  normalizedName: string;
  quantities: GroceryQuantity[];
  contributions: GroceryContribution[];
  inPantry: boolean;
}

export interface GroceryList {
  lines: GroceryLine[];
  recipeCount: number;
}

export interface PantryItem {
  id: number;
  name: string;
  normalizedName: string;
  createdAt: string;
}

export interface Household {
  id: number;
  name: string;
  frysLocationId: string | null;
  frysLocationName: string | null;
  frysConnected: boolean;
  frysConnectedAt: string | null;
}

export function listRecipes(): Promise<RecipeSummary[]> {
  return fetch("/api/recipes").then((r) => json<RecipeSummary[]>(r));
}

export function getRecipe(id: number): Promise<Recipe> {
  return fetch(`/api/recipes/${id}`).then((r) => json<Recipe>(r));
}

export function createRecipe(input: RecipeInput): Promise<Recipe> {
  return fetch("/api/recipes", { method: "POST", headers: jsonHeaders, body: JSON.stringify(input) }).then(
    (r) => json<Recipe>(r),
  );
}

export function updateRecipe(id: number, input: RecipeInput): Promise<Recipe> {
  return fetch(`/api/recipes/${id}`, { method: "PUT", headers: jsonHeaders, body: JSON.stringify(input) }).then(
    (r) => json<Recipe>(r),
  );
}

export function deleteRecipe(id: number): Promise<void> {
  return fetch(`/api/recipes/${id}`, { method: "DELETE" }).then(empty);
}

export function listSelections(): Promise<Selection[]> {
  return fetch("/api/selections").then((r) => json<Selection[]>(r));
}

export function addSelection(recipeId: number): Promise<Selection[]> {
  return fetch("/api/selections", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ recipeId }),
  }).then((r) => json<Selection[]>(r));
}

export function removeSelection(recipeId: number): Promise<Selection[]> {
  return fetch(`/api/selections/${recipeId}`, { method: "DELETE" }).then((r) => json<Selection[]>(r));
}

export function clearSelections(): Promise<void> {
  return fetch("/api/selections", { method: "DELETE" }).then(empty);
}

export function getGroceryList(): Promise<GroceryList> {
  return fetch("/api/grocery-list").then((r) => json<GroceryList>(r));
}

export function listPantry(): Promise<PantryItem[]> {
  return fetch("/api/pantry").then((r) => json<PantryItem[]>(r));
}

export function addPantryItem(name: string): Promise<PantryItem[]> {
  return fetch("/api/pantry", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ name }) }).then(
    (r) => json<PantryItem[]>(r),
  );
}

export function removePantryItem(id: number): Promise<PantryItem[]> {
  return fetch(`/api/pantry/${id}`, { method: "DELETE" }).then((r) => json<PantryItem[]>(r));
}

export function getHousehold(): Promise<Household> {
  return fetch("/api/household").then((r) => json<Household>(r));
}

export function renameHousehold(name: string): Promise<Household> {
  return fetch("/api/household", { method: "PUT", headers: jsonHeaders, body: JSON.stringify({ name }) }).then(
    (r) => json<Household>(r),
  );
}

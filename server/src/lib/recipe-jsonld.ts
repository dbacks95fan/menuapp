// ABOUTME: Pulls a recipe out of a page's schema.org JSON-LD (the
// ABOUTME: <script type="application/ld+json"> blocks most recipe sites embed).
import { parseIngredientLine, type ParsedIngredient } from "./ingredient-parser.js";

export interface ExtractedRecipe {
  name: string;
  servings: number | null;
  ingredients: ParsedIngredient[];
}

const SCRIPT_RE = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

export function extractRecipeFromHtml(html: string): ExtractedRecipe | null {
  for (const match of html.matchAll(SCRIPT_RE)) {
    let data: unknown;
    try {
      data = JSON.parse(match[1].trim());
    } catch {
      continue;
    }
    const recipe = findRecipeNode(data);
    if (recipe) return normalize(recipe);
  }
  return null;
}

function findRecipeNode(node: unknown): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const type = obj["@type"];
    const types = Array.isArray(type) ? type : [type];
    if (types.some((t) => typeof t === "string" && t.toLowerCase() === "recipe")) {
      return obj;
    }
    if (obj["@graph"]) return findRecipeNode(obj["@graph"]);
  }
  return null;
}

function parseYield(value: unknown): number | null {
  if (typeof value === "number") return Math.round(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const n = parseYield(item);
      if (n) return n;
    }
    return null;
  }
  if (typeof value === "string") {
    const m = value.match(/\d{1,3}/);
    return m ? Number(m[0]) : null;
  }
  return null;
}

function normalize(recipe: Record<string, unknown>): ExtractedRecipe {
  const name = typeof recipe.name === "string" && recipe.name.trim() ? recipe.name.trim() : "Imported recipe";

  const raw = Array.isArray(recipe.recipeIngredient)
    ? recipe.recipeIngredient
    : Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : [];

  const ingredients = raw
    .filter((x): x is string => typeof x === "string")
    .map(parseIngredientLine)
    .filter((parsed) => parsed.name.trim() !== "");

  return { name, servings: parseYield(recipe.recipeYield), ingredients };
}

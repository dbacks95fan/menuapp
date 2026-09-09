// ABOUTME: Combines ingredient rows from the week's selected recipes into one
// ABOUTME: grocery list — grouped by normalized name, summed per compatible
// ABOUTME: unit bucket, with incompatible units kept side by side and nothing
// ABOUTME: dropped.
import { normalizeIngredientName } from "./normalize-name.js";
import { addCompatible, areCompatible, type Quantity } from "./units.js";

export interface GroceryInput {
  recipeId: number;
  recipeName: string;
  name: string;
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
  quantities: Quantity[];
  contributions: GroceryContribution[];
}

export function buildGroceryList(inputs: GroceryInput[]): GroceryLine[] {
  const groups = new Map<string, { name: string; entries: GroceryInput[] }>();

  for (const input of inputs) {
    const key = normalizeIngredientName(input.name);
    const group = groups.get(key);
    if (group) {
      group.entries.push(input);
    } else {
      groups.set(key, { name: input.name.trim(), entries: [input] });
    }
  }

  const lines: GroceryLine[] = [];
  for (const [normalizedName, group] of groups) {
    const buckets: Quantity[][] = [];
    for (const entry of group.entries) {
      const q: Quantity = { quantity: entry.quantity, unit: entry.unit };
      const bucket = buckets.find((b) => areCompatible(b[0].unit, q.unit));
      if (bucket) bucket.push(q);
      else buckets.push([q]);
    }

    lines.push({
      name: group.name,
      normalizedName,
      quantities: buckets.map(addCompatible),
      contributions: group.entries.map((entry) => ({
        recipeId: entry.recipeId,
        recipeName: entry.recipeName,
        quantity: entry.quantity,
        unit: entry.unit,
      })),
    });
  }

  return lines.sort((a, b) => a.normalizedName.localeCompare(b.normalizedName));
}

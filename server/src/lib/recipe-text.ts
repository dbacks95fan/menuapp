// ABOUTME: Best-effort extraction of a recipe (name, servings, ingredient rows)
// ABOUTME: from pasted free-text. The user reviews the result before it saves.
import { parseIngredientLine, type ParsedIngredient } from "./ingredient-parser.js";

export interface ExtractedRecipe {
  name: string;
  servings: number | null;
  ingredients: ParsedIngredient[];
}

const SECTION_START = /^\s*ingredients?\s*:?\s*$/i;
const SECTION_END = /^\s*(instructions?|directions?|method|steps|preparation|notes)\s*:?\s*$/i;
const SERVINGS_RE = /(?:serves|servings?|yield|makes)\D{0,4}(\d{1,3})/i;

function stripHeading(line: string): string {
  return line.replace(/^#+\s*/, "").trim();
}

function looksLikeIngredient(line: string): boolean {
  if (/^[-*••]\s+/.test(line)) return true;
  if (/^\s*[\d¼½¾⅓⅔⅛]/.test(line)) return true;
  const words = line.split(/\s+/).length;
  return words <= 6 && !/[.!?:]$/.test(line);
}

export function extractRecipeFromText(text: string): ExtractedRecipe {
  const lines = text.split(/\r?\n/).map((line) => line.trim());

  let name = "";
  for (const line of lines) {
    if (!line || SECTION_START.test(line) || SECTION_END.test(line)) continue;
    name = stripHeading(line);
    break;
  }

  const servingsMatch = text.match(SERVINGS_RE);
  const servings = servingsMatch ? Number(servingsMatch[1]) : null;

  const headerIdx = lines.findIndex((line) => SECTION_START.test(line));
  const candidates: string[] = [];

  if (headerIdx !== -1) {
    for (let i = headerIdx + 1; i < lines.length; i += 1) {
      if (SECTION_END.test(lines[i])) break;
      if (lines[i]) candidates.push(lines[i]);
    }
  } else {
    const nameIdx = lines.findIndex((line) => line && stripHeading(line) === name);
    for (let i = nameIdx + 1; i < lines.length; i += 1) {
      if (SECTION_END.test(lines[i])) break;
      if (lines[i] && looksLikeIngredient(lines[i])) candidates.push(lines[i]);
    }
  }

  const ingredients = candidates
    .map(parseIngredientLine)
    .filter((parsed) => parsed.name.trim() !== "");

  return { name, servings, ingredients };
}

// ABOUTME: Deterministic parser that splits a free-text ingredient line into
// ABOUTME: quantity / unit / name / note. No LLM; safe to run offline.
import { KNOWN_UNITS, normalizeUnit } from "./units.js";

export interface ParsedIngredient {
  raw: string;
  quantity: number | null;
  unit: string | null;
  name: string;
  note: string | null;
}

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75,
  "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8,
  "⅙": 1 / 6, "⅚": 5 / 6, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

function toDecimal(token: string): number | null {
  const range = token.split(/[-–—]|(?:\bto\b)/).map((t) => t.trim()).filter(Boolean);
  if (range.length === 2) {
    const lo = toDecimal(range[0]);
    const hi = toDecimal(range[1]);
    if (lo != null && hi != null) return Math.max(lo, hi); // buy enough for the top of the range
  }
  if (/^\d+$/.test(token)) return Number.parseInt(token, 10);
  if (/^\d+\.\d+$/.test(token)) return Number.parseFloat(token);
  const frac = token.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number.parseInt(frac[1], 10) / Number.parseInt(frac[2], 10);
  return null;
}

export function parseIngredientLine(input: string): ParsedIngredient {
  const raw = input.trim().replace(/\s+/g, " ");

  let s = raw.replace(/^\s*([-*••]|\d+[.)])\s+/, ""); // list marker
  s = s.replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (m) => ` ${UNICODE_FRACTIONS[m]} `);
  s = s.replace(/(\d)\s*([a-zA-Z])/g, "$1 $2").replace(/\s+/g, " ").trim(); // "400g" -> "400 g"

  const tokens = s.split(" ").filter(Boolean);
  let quantity: number | null = null;
  let i = 0;

  if (tokens[0] && /^(a|an)$/i.test(tokens[0])) {
    const next = tokens[1] ? normalizeUnit(tokens[1]) : null;
    if (next && KNOWN_UNITS.has(next)) {
      quantity = 1;
      i = 1;
    }
  }

  while (i < tokens.length && toDecimal(tokens[i]) != null) {
    quantity = (quantity ?? 0) + (toDecimal(tokens[i]) as number);
    i += 1;
  }

  let unit: string | null = null;
  const pair = tokens[i] && tokens[i + 1] ? normalizeUnit(`${tokens[i]} ${tokens[i + 1]}`) : null;
  if (pair && KNOWN_UNITS.has(pair)) {
    unit = pair;
    i += 2;
  } else if (tokens[i]) {
    const one = normalizeUnit(tokens[i]);
    if (one && KNOWN_UNITS.has(one)) {
      unit = one;
      i += 1;
    }
  }

  let rest = tokens.slice(i).join(" ").replace(/^of\s+/i, "").trim();
  let note: string | null = null;

  const paren = rest.match(/\s*\(([^)]*)\)\s*/);
  if (paren) {
    note = paren[1].trim() || null;
    rest = (rest.slice(0, paren.index) + rest.slice((paren.index ?? 0) + paren[0].length)).trim();
  }

  const comma = rest.indexOf(",");
  if (comma !== -1) {
    const after = rest.slice(comma + 1).trim();
    if (after) note = note ? `${note}, ${after}` : after;
    rest = rest.slice(0, comma).trim();
  }

  return { raw, quantity: quantity ?? null, unit, name: rest || raw, note };
}

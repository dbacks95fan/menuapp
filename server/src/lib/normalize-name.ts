// ABOUTME: Canonicalises an ingredient name into a stable key used for grouping
// ABOUTME: the combined list, pantry matching, and product-map lookups.

const IRREGULAR_PLURALS: Record<string, string> = {
  leaves: "leaf",
  loaves: "loaf",
  halves: "half",
  knives: "knife",
};

// Descriptors that don't change what to buy.
const DROP_WORDS = new Set([
  "fresh", "dried", "ground", "chopped", "minced", "diced", "sliced", "grated",
  "shredded", "large", "small", "medium", "ripe", "raw", "cooked", "whole",
  "boneless", "skinless", "organic", "of",
]);

function singularize(word: string): string {
  if (IRREGULAR_PLURALS[word]) return IRREGULAR_PLURALS[word];
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("oes") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("ss")) return word;
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

export function normalizeIngredientName(raw: string): string {
  let s = raw.toLowerCase();
  s = s.replace(/\([^)]*\)/g, " "); // drop parentheticals
  s = s.split(",")[0]; // drop trailing prep notes
  s = s.replace(/[^a-z0-9\s-]/g, " ");

  const words = s
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !DROP_WORDS.has(w))
    .filter((w) => !/^\d+([./]\d+)?$/.test(w)); // drop bare numbers

  if (words.length === 0) return raw.trim().toLowerCase();

  words[words.length - 1] = singularize(words[words.length - 1]);
  return words.join(" ");
}

// ABOUTME: /api/import — turn pasted text or a recipe URL into a draft recipe
// ABOUTME: (name + ingredient rows) for the user to review. Nothing is saved
// ABOUTME: here; the client posts the reviewed draft to /api/recipes.
import { Router } from "express";
import { z } from "zod";
import { extractRecipeFromHtml } from "../lib/recipe-jsonld.js";
import { extractRecipeFromText, type ExtractedRecipe } from "../lib/recipe-text.js";
import { FetchError, fetchHtml } from "../lib/safe-fetch.js";
import { normalizeUnit } from "../lib/units.js";

export const importRouter = Router();

function toDraft(extracted: ExtractedRecipe) {
  return {
    name: extracted.name,
    servings: extracted.servings,
    ingredients: extracted.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: normalizeUnit(i.unit),
      note: i.note,
      raw: i.raw,
    })),
  };
}

const TextBody = z.object({ text: z.string().trim().min(1).max(50_000) });

importRouter.post("/api/import/text", (req, res) => {
  const parsed = TextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "text is required" });
    return;
  }
  res.json(toDraft(extractRecipeFromText(parsed.data.text)));
});

const UrlBody = z.object({ url: z.string().url() });

importRouter.post("/api/import/url", async (req, res, next) => {
  const parsed = UrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "a valid url is required" });
    return;
  }
  try {
    const html = await fetchHtml(parsed.data.url);
    const extracted = extractRecipeFromHtml(html);
    if (!extracted) {
      res.status(422).json({ error: "Could not find a recipe on that page." });
      return;
    }
    res.json(toDraft(extracted));
  } catch (err) {
    if (err instanceof FetchError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    if (err instanceof Error && err.name === "TimeoutError") {
      res.status(422).json({ error: "That page took too long to respond." });
      return;
    }
    next(err);
  }
});

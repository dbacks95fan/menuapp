import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createRecipe } from "../lib/api";

export function AddRecipe() {
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createRecipe({
        name,
        ingredients: ingredients
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recipe");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="add-recipe-form">
      <label htmlFor="recipe-name">Recipe name</label>
      <input
        id="recipe-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <label htmlFor="recipe-ingredients">Ingredients (one per line)</label>
      <textarea
        id="recipe-ingredients"
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        rows={6}
        required
      />

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save recipe"}
      </button>
    </form>
  );
}

import { useEffect, useState } from "react";
import { getRecipes } from "../lib/api";

export function Groceries() {
  const [ingredients, setIngredients] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRecipes()
      .then((recipes) => {
        const unique = Array.from(new Set(recipes.flatMap((r) => r.ingredients))).sort();
        setIngredients(unique);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <p role="alert">Failed to load groceries: {error}</p>;
  if (!ingredients) return <p>Loading groceries…</p>;
  if (ingredients.length === 0) return <p>No ingredients yet — add a recipe first.</p>;

  return (
    <ul className="grocery-list">
      {ingredients.map((ingredient) => (
        <li key={ingredient}>{ingredient}</li>
      ))}
    </ul>
  );
}

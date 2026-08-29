import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecipes, type Recipe } from "../lib/api";

export function RecipeLibrary() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRecipes()
      .then(setRecipes)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <p role="alert">Failed to load recipes: {error}</p>;
  if (!recipes) return <p>Loading recipes…</p>;
  if (recipes.length === 0) {
    return (
      <div className="empty-state">
        <p>Your recipe library is empty. You haven&apos;t added any recipes yet.</p>
        <Link className="empty-state-action" to="/add-recipe">
          Add your first recipe
        </Link>
      </div>
    );
  }

  return (
    <ul className="recipe-list">
      {recipes.map((recipe) => (
        <li key={recipe.id} className="recipe-card">
          <h3>{recipe.name}</h3>
          <ul>
            {recipe.ingredients.map((ingredient, i) => (
              <li key={i}>{ingredient}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

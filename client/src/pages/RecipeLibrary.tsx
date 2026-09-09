// ABOUTME: The household recipe list — search by name/tag, open a recipe, or
// ABOUTME: start a new one.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listRecipes, type RecipeSummary } from "../lib/api";
import { useSelections } from "../lib/useSelections";

export function RecipeLibrary() {
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { isSelected, toggle } = useSelections();

  useEffect(() => {
    listRecipes()
      .then(setRecipes)
      .catch((err: Error) => setError(err.message));
  }, []);

  const filtered = useMemo(() => {
    if (!recipes) return [];
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [recipes, query]);

  if (error) return <p role="alert">Failed to load recipes: {error}</p>;
  if (!recipes) return <p>Loading recipes…</p>;

  if (recipes.length === 0) {
    return (
      <div className="empty-state">
        <p>Your recipe library is empty. You haven&apos;t added any recipes yet.</p>
        <div className="toolbar">
          <Link className="button" to="/recipes/new">
            Add your first recipe
          </Link>
          <Link className="button" to="/recipes/import">
            Import a recipe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search recipes or tags"
          aria-label="Search recipes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Link className="button" to="/recipes/new">
          Add recipe
        </Link>
        <Link className="button" to="/recipes/import">
          Import
        </Link>
      </div>

      {filtered.length === 0 ? (
        <p>No recipes match “{query}”.</p>
      ) : (
        <ul className="card-list">
          {filtered.map((recipe) => (
            <li key={recipe.id} className="card">
              <div className="toolbar">
                <Link to={`/recipes/${recipe.id}`}>
                  <h3>{recipe.name}</h3>
                </Link>
                <button
                  type="button"
                  aria-pressed={isSelected(recipe.id)}
                  onClick={() => void toggle(recipe.id)}
                >
                  {isSelected(recipe.id) ? "In this week ✓" : "Add to this week"}
                </button>
              </div>
              <p className="muted">
                {recipe.ingredientCount} ingredient{recipe.ingredientCount === 1 ? "" : "s"}
                {recipe.servings ? ` · serves ${recipe.servings}` : ""}
              </p>
              {recipe.tags.length > 0 && (
                <p className="tag-row">
                  {recipe.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

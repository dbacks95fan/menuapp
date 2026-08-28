export interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  createdAt: string;
}

export interface Preference {
  key: string;
  value: string;
  updated_at: string;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getRecipes(): Promise<Recipe[]> {
  return fetch("/api/recipes").then((res) => json(res));
}

export function createRecipe(input: { name: string; ingredients: string[] }): Promise<Recipe> {
  return fetch("/api/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((res) => json(res));
}

export function getPreferences(): Promise<Preference[]> {
  return fetch("/api/preferences").then((res) => json(res));
}

export function setPreference(key: string, value: string): Promise<Preference> {
  return fetch(`/api/preferences/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  }).then((res) => json(res));
}

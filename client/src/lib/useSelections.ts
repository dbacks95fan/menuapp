// ABOUTME: Hook over /api/selections — the shared "this week" recipe list.
import { useCallback, useEffect, useState } from "react";
import {
  addSelection,
  clearSelections,
  listSelections,
  removeSelection,
  type Selection,
} from "./api";

export function useSelections() {
  const [selections, setSelections] = useState<Selection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listSelections()
      .then(setSelections)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(refresh, [refresh]);

  const isSelected = useCallback(
    (recipeId: number) => Boolean(selections?.some((s) => s.recipeId === recipeId)),
    [selections],
  );

  const toggle = useCallback(
    async (recipeId: number) => {
      try {
        const next = isSelected(recipeId)
          ? await removeSelection(recipeId)
          : await addSelection(recipeId);
        setSelections(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update the weekly selection");
      }
    },
    [isSelected],
  );

  const clear = useCallback(async () => {
    try {
      await clearSelections();
      setSelections([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear the week");
    }
  }, []);

  return { selections, isSelected, toggle, clear, error };
}

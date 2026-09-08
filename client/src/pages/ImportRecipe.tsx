// ABOUTME: Bring a recipe in by pasting text, uploading a file (.txt/.md/.pdf/
// ABOUTME: image), or giving a URL. Produces a draft, then hands off to the
// ABOUTME: recipe form for review before anything is saved.
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { importText, importUrl, type RecipeDraft } from "../lib/api";
import { extractTextFromFile } from "../lib/extract-file";

type Mode = "paste" | "file" | "url";

export function ImportRecipe() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("paste");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runImport(makeDraft: () => Promise<RecipeDraft>) {
    setBusy(true);
    setError(null);
    try {
      const draft = await makeDraft();
      navigate("/recipes/new", { state: { draft } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setBusy(false);
      setStatus(null);
    }
  }

  async function handlePaste(event: FormEvent) {
    event.preventDefault();
    await runImport(() => importText(text));
  }

  async function handleUrl(event: FormEvent) {
    event.preventDefault();
    await runImport(() => importUrl(url.trim()));
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setStatus("Reading file…");
    await runImport(async () => importText(await extractTextFromFile(file, setStatus)));
  }

  return (
    <div className="stack">
      <h2>Import a recipe</h2>

      <div className="toolbar" role="tablist">
        {(["paste", "file", "url"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
          >
            {m === "paste" ? "Paste text" : m === "file" ? "Upload file" : "From URL"}
          </button>
        ))}
      </div>

      {mode === "paste" && (
        <form onSubmit={handlePaste} className="stack">
          <label>
            Paste the recipe text
            <textarea
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Recipe name\nIngredients\n2 cups flour\n1 tsp salt\n…"}
            />
          </label>
          <button type="submit" disabled={busy || text.trim() === ""}>
            {busy ? "Working…" : "Extract ingredients"}
          </button>
        </form>
      )}

      {mode === "file" && (
        <div className="stack">
          <label>
            Choose a .txt, .md, .pdf, or image file
            <input
              type="file"
              accept=".txt,.md,.pdf,image/*"
              onChange={(e) => void handleFile(e.target.files?.[0])}
              disabled={busy}
            />
          </label>
          {status && <p className="muted">{status}</p>}
        </div>
      )}

      {mode === "url" && (
        <form onSubmit={handleUrl} className="stack">
          <label>
            Recipe page URL
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/recipes/chili"
            />
          </label>
          <button type="submit" disabled={busy || url.trim() === ""}>
            {busy ? "Fetching…" : "Fetch recipe"}
          </button>
        </form>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  );
}

// ABOUTME: Turns an uploaded recipe file into plain text in the browser —
// ABOUTME: .txt/.md directly, .pdf via pdfjs, images via tesseract OCR. The
// ABOUTME: heavy libraries load only when actually needed.

export type ExtractProgress = (message: string) => void;

export async function extractTextFromFile(file: File, onProgress?: ExtractProgress): Promise<string> {
  const name = file.name.toLowerCase();

  if (file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return file.text();
  }

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    onProgress?.("Reading PDF…");
    return extractPdf(file);
  }

  if (file.type.startsWith("image/")) {
    onProgress?.("Running text recognition…");
    return extractImage(file, onProgress);
  }

  throw new Error("Unsupported file type. Use a .txt, .md, .pdf, or image file.");
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Vite bundles the worker and hands back its URL; loads same-origin ('self').
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise;

  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n += 1) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+\n/g, "\n"),
    );
  }
  return pages.join("\n");
}

async function extractImage(file: File, onProgress?: ExtractProgress): Promise<string> {
  const { recognize } = await import("tesseract.js");
  const { data } = await recognize(file, "eng", {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress?.(`Recognizing text… ${Math.round(m.progress * 100)}%`);
      }
    },
  });
  return data.text;
}

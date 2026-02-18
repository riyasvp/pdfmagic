// PDF Thumbnail Generator - Client-side only
// Uses PDF.js from CDN to avoid npm dependency issues

interface PDFJSLib {
  getDocument: (params: { data: ArrayBuffer; verbosity?: number }) => { promise: Promise<PDFDocument>; onPassword?: () => void };
  GlobalWorkerOptions: { workerSrc: string };
  version: string;
}

interface PDFDocument {
  numPages: number;
  getPage: (num: number) => Promise<PDFPage>;
  destroy: () => void;
}

interface PDFPage {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number }; background?: string }) => { promise: Promise<void> };
}

let pdfjsLib: PDFJSLib | null = null;
let loadingPromise: Promise<PDFJSLib> | null = null;

// Load PDF.js from CDN
async function loadPdfJs(): Promise<PDFJSLib> {
  if (pdfjsLib) return pdfjsLib;
  if (loadingPromise) return loadingPromise;

  if (typeof window === "undefined") {
    throw new Error("PDF.js can only be used in browser environment");
  }

  loadingPromise = (async () => {
    // @ts-expect-error - pdfjsLib is loaded dynamically
    const pdfjs = await import("https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.min.mjs");
    
    pdfjsLib = {
      getDocument: pdfjs.getDocument,
      GlobalWorkerOptions: pdfjs.GlobalWorkerOptions,
      version: "4.0.379",
    };

    // Configure worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs";

    console.log("[PDF.js] Loaded from CDN");
    return pdfjsLib;
  })();

  return loadingPromise;
}

export interface ThumbnailResult {
  dataUrl: string;
  width: number;
  height: number;
  pageCount: number;
}

// Cache for generated thumbnails
const thumbnailCache = new Map<string, ThumbnailResult>();

/**
 * Generate a thumbnail for the first page of a PDF file
 */
export async function generatePDFThumbnail(
  file: File,
  maxSize: number = 180
): Promise<ThumbnailResult> {
  // Check cache first
  const cacheKey = `${file.name}-${file.size}-${file.lastModified}-${maxSize}`;
  if (thumbnailCache.has(cacheKey)) {
    console.log(`[Thumbnail] Cache hit for ${file.name}`);
    return thumbnailCache.get(cacheKey)!;
  }

  console.log(`[Thumbnail] Generating for ${file.name}`);

  try {
    const pdfjs = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      verbosity: 0,
    });

    const pdfDocument = await loadingTask.promise;
    console.log(`[Thumbnail] PDF loaded, ${pdfDocument.numPages} pages`);

    const page = await pdfDocument.getPage(1);

    const viewport = page.getViewport({ scale: 1 });
    const scale = maxSize / Math.max(viewport.width, viewport.height);
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Failed to create canvas context");
    }

    canvas.width = Math.floor(scaledViewport.width);
    canvas.height = Math.floor(scaledViewport.height);

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
      background: "white",
    }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    const result: ThumbnailResult = {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      pageCount: pdfDocument.numPages,
    };

    thumbnailCache.set(cacheKey, result);
    pdfDocument.destroy();

    return result;
  } catch (error) {
    console.error(`[Thumbnail] Error for ${file.name}:`, error);
    throw error;
  }
}

/**
 * Retry thumbnail generation with exponential backoff
 */
export async function generatePDFThumbnailWithRetry(
  file: File,
  maxSize: number = 180,
  maxRetries: number = 3
): Promise<ThumbnailResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generatePDFThumbnail(file, maxSize);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[Thumbnail] Attempt ${attempt}/${maxRetries} failed`);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      }
    }
  }

  throw lastError || new Error("Failed to generate thumbnail");
}

/**
 * Get PDF page count
 */
export async function getPDFPageCount(file: File): Promise<number> {
  try {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer, verbosity: 0 });
    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;
    pdfDocument.destroy();
    return pageCount;
  } catch {
    return 1;
  }
}

/**
 * Clear thumbnail cache
 */
export function clearThumbnailCache(): void {
  thumbnailCache.clear();
}

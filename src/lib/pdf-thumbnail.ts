// PDF Thumbnail Generator - Client-side only
// Uses dynamic import to avoid SSR issues with pdfjs-dist

let pdfjsLib: typeof import("pdfjs-dist") | null = null;
let workerConfigured = false;

// Lazy load PDF.js only on client side
async function getPdfLib() {
  if (pdfjsLib) return pdfjsLib;

  if (typeof window === "undefined") {
    throw new Error("PDF.js can only be used in browser environment");
  }

  try {
    // Import pdfjs-dist
    pdfjsLib = await import("pdfjs-dist");

    // Configure worker - use unpkg CDN which is more reliable
    if (!workerConfigured) {
      // Get the version from the library
      const version = pdfjsLib.version || "5.4.624";

      // Use unpkg CDN for the worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

      workerConfigured = true;
      console.log(`[PDF.js] Worker configured: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`);
    }

    return pdfjsLib;
  } catch (error) {
    console.error("[PDF.js] Failed to load:", error);
    throw error;
  }
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

  console.log(`[Thumbnail] Generating for ${file.name} (${file.size} bytes)`);

  try {
    const pdfjs = await getPdfLib();

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log(`[Thumbnail] File loaded, buffer size: ${arrayBuffer.byteLength}`);

    // Load PDF document with better error handling
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      verbosity: 0, // Reduce console noise
    });

    // Set up password callback for encrypted PDFs
    loadingTask.onPassword = () => {
      throw new Error("PDF is password protected");
    };

    const pdfDocument = await loadingTask.promise;
    console.log(`[Thumbnail] PDF loaded, ${pdfDocument.numPages} pages`);

    // Get first page
    const page = await pdfDocument.getPage(1);

    // Calculate scale to fit maxSize while maintaining aspect ratio
    const viewport = page.getViewport({ scale: 1 });
    const scale = maxSize / Math.max(viewport.width, viewport.height);
    const scaledViewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Failed to create canvas context");
    }

    canvas.width = Math.floor(scaledViewport.width);
    canvas.height = Math.floor(scaledViewport.height);

    console.log(`[Thumbnail] Rendering at ${canvas.width}x${canvas.height}`);

    // Set white background for transparent PDFs
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
      background: "white",
    }).promise;

    // Convert to data URL with good quality
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    const result: ThumbnailResult = {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      pageCount: pdfDocument.numPages,
    };

    // Cache result
    thumbnailCache.set(cacheKey, result);

    // Cleanup
    pdfDocument.destroy();

    console.log(`[Thumbnail] Successfully generated for ${file.name}`);
    return result;
  } catch (error) {
    console.error(`[Thumbnail] Error generating thumbnail for ${file.name}:`, error);
    throw error;
  }
}

/**
 * Generate thumbnails for multiple PDFs in batches
 */
export async function generateBatchThumbnails(
  files: File[],
  maxSize: number = 180,
  onProgress?: (index: number, total: number) => void
): Promise<Map<string, ThumbnailResult>> {
  const results = new Map<string, ThumbnailResult>();

  // Process in batches of 3 to avoid memory issues
  const batchSize = 3;

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (file) => {
        try {
          const result = await generatePDFThumbnail(file, maxSize);
          results.set(file.name + file.size, result);
        } catch (error) {
          console.error(`Failed to generate thumbnail for ${file.name}:`, error);
        }
      })
    );

    onProgress?.(Math.min(i + batchSize, files.length), files.length);
  }

  return results;
}

/**
 * Get PDF page count without generating thumbnail
 */
export async function getPDFPageCount(file: File): Promise<number> {
  try {
    const pdfjs = await getPdfLib();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer, verbosity: 0 });
    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;
    pdfDocument.destroy();
    return pageCount;
  } catch (error) {
    console.error("Error getting PDF page count:", error);
    return 1;
  }
}

/**
 * Clear thumbnail cache to free memory
 */
export function clearThumbnailCache(): void {
  thumbnailCache.clear();
  console.log("[Thumbnail] Cache cleared");
}

/**
 * Get cache size for memory management
 */
export function getThumbnailCacheSize(): number {
  return thumbnailCache.size;
}

/**
 * Check if PDF.js is available (client-side only)
 */
export function isPDFAvailable(): boolean {
  return typeof window !== "undefined";
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
      console.warn(`[Thumbnail] Attempt ${attempt}/${maxRetries} failed for ${file.name}:`, error);

      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      }
    }
  }

  throw lastError || new Error("Failed to generate thumbnail after retries");
}

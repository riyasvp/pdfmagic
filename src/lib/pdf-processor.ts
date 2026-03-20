import { exec } from "child_process";
import { promisify } from "util";
import { mkdir, writeFile, unlink, access } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

const UPLOAD_DIR = join(process.cwd(), "upload");
const DOWNLOAD_DIR = join(process.cwd(), "download");
const SCRIPTS_DIR = join(process.cwd(), "scripts");

// Python script output type - extends to include all possible properties
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PythonScriptResult = {
  success: boolean;
  output?: string;
  error?: string;
  // Common Python script return properties
  linksAdded?: number;
  bookmarks?: unknown[];
  bookmarkCount?: number;
  file1_pages?: number;
  file2_pages?: number;
  identical_pages?: number;
  notice?: string;
  attachmentCount?: number;
  count?: number;
  linkCount?: number;
  links?: unknown[];
  jsonOutput?: string;
  pagesExtracted?: number;
  pagesPerSheet?: number;
  originalPages?: number;
  imposedSheets?: number;
  metadata?: Record<string, unknown>;
  pages_processed?: number;
  originalSize?: number;
  optimizedSize?: number;
  reduction?: number;
  original_pages?: number;
  new_pages?: number;
  pdfaVersion?: string;
  pagesRecovered?: number;
  permissions?: Record<string, boolean>;
  files_count?: number;
  stampedCount?: number;
  failedCount?: number;
  unlocked?: boolean;
  password?: string;
  passwordsTried?: number;
  validation?: Record<string, unknown>;
  // Additional properties as needed by Python scripts
  [key: string]: unknown;
};

// Ensure directories exist
export async function ensureDirectories(): Promise<void> {
  try {
    await access(UPLOAD_DIR);
  } catch {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
  try {
    await access(DOWNLOAD_DIR);
  } catch {
    await mkdir(DOWNLOAD_DIR, { recursive: true });
  }
}

// Generate unique filename
export function generateUniqueId(): string {
  return `${Date.now()}-${randomUUID()}`;
}

// Save uploaded file
export async function saveUploadedFile(
  file: File,
  customName?: string
): Promise<string> {
  await ensureDirectories();

  const uniqueId = customName || generateUniqueId();
  const fileName = `${uniqueId}-${file.name}`;
  const filePath = join(UPLOAD_DIR, fileName);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filePath, buffer);

  return filePath;
}

// Execute Python script
export async function executePythonScript(
  scriptName: string,
  args: string[]
): Promise<PythonScriptResult> {
  const scriptPath = join(SCRIPTS_DIR, scriptName);
  
  // Set environment variables for Python scripts
  const env = {
    ...process.env,
    DOWNLOAD_DIR: DOWNLOAD_DIR,
    UPLOAD_DIR: UPLOAD_DIR,
  };

  try {
    // Escape paths for shell (handle Windows paths with spaces)
    const escapedArgs = args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(" ");
    
    // Use py -3 on Windows, python3 on Unix
    const pythonCmd = process.platform === "win32" ? "py -3" : "python3";
    
    const { stdout, stderr } = await execAsync(
      `${pythonCmd} "${scriptPath}" ${escapedArgs}`,
      {
        timeout: 120000, // 2 minutes timeout
        maxBuffer: 1024 * 1024 * 50, // 50MB buffer
        env,
      }
    );

    if (stderr && !stderr.includes("warning")) {
      console.error("Python stderr:", stderr);
    }

    // Parse JSON output
    try {
      const result = JSON.parse(stdout.trim()) as PythonScriptResult;
      return result;
    } catch {
      // If not JSON, return raw output
      return { success: true, output: stdout.trim() };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Python execution error:", errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    for (const arg of args) {
      await cleanupFile(arg);
    }
  }
}

// Get download URL
export function getDownloadUrl(fileName: string): string {
  return `/api/download/${fileName}`;
}

// Clean up file
export async function cleanupFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error("Failed to cleanup file:", error);
  }
}

// Get file extension from mime type
export function getExtensionFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "text/html": ".html",
  };

  return mimeMap[mimeType] || "";
}

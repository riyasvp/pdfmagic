import { exec } from "child_process";
import { promisify } from "util";
import { mkdir, writeFile, unlink, access } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

const UPLOAD_DIR = "/home/z/my-project/upload";
const DOWNLOAD_DIR = "/home/z/my-project/download";
const SCRIPTS_DIR = "/home/z/my-project/scripts";

// Ensure directories exist
export async function ensureDirectories() {
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
): Promise<{ success: boolean; output?: string; error?: string }> {
  const scriptPath = join(SCRIPTS_DIR, scriptName);

  try {
    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" ${args.map((a) => `"${a}"`).join(" ")}`,
      {
        timeout: 120000, // 2 minutes timeout
        maxBuffer: 1024 * 1024 * 50, // 50MB buffer
      }
    );

    if (stderr && !stderr.includes("warning")) {
      console.error("Python stderr:", stderr);
    }

    // Parse JSON output
    try {
      return JSON.parse(stdout.trim());
    } catch {
      // If not JSON, return raw output
      return { success: true, output: stdout.trim() };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Python execution error:", errorMessage);
    return { success: false, error: errorMessage };
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

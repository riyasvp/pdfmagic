import { exec } from "child_process";
import { promisify } from "util";
import { mkdir, writeFile, unlink, access, readFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

// Use /tmp for Vercel serverless compatibility
const TMP_DIR = process.env.VERCEL === '1' ? '/tmp' : process.cwd();
const UPLOAD_DIR = join(TMP_DIR, "upload");
const DOWNLOAD_DIR = join(TMP_DIR, "download");
const SCRIPTS_DIR = join(process.cwd(), "scripts");

// Render Python service URL
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "https://pdfmagic-zwxl.onrender.com";

// Python script output type
export type PythonScriptResult = {
  success: boolean;
  output?: string;
  error?: string;
  downloadUrl?: string;
  fileName?: string;
  file_data?: string;
  text?: string;
  metadata?: Record<string, unknown>;
  pages?: number;
  info?: Record<string, unknown>;
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

// Execute Python script - NOW ROUTES TO RENDER PYTHON SERVICE
export async function executePythonScript(
  scriptName: string,
  args: string[]
): Promise<PythonScriptResult> {
  // If running on Vercel, use the Render Python service
  if (process.env.VERCEL === '1') {
    return executeViaRenderService(scriptName, args);
  }

  // Local development - use local Python
  const scriptPath = join(SCRIPTS_DIR, scriptName);
  const env = {
    ...process.env,
    DOWNLOAD_DIR: DOWNLOAD_DIR,
    UPLOAD_DIR: UPLOAD_DIR,
  };

  try {
    const pythonCmd = process.platform === "win32" ? "py -3" : "python3";
    const escapedArgs = args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(" ");

    const { stdout, stderr } = await execAsync(
      `${pythonCmd} "${scriptPath}" ${escapedArgs}`,
      {
        timeout: 120000,
        maxBuffer: 1024 * 1024 * 50,
        env,
      }
    );

    if (stderr && !stderr.includes("warning")) {
      console.error("Python stderr:", stderr);
    }

    try {
      const result = JSON.parse(stdout.trim()) as PythonScriptResult;
      return result;
    } catch {
      return { success: true, output: stdout.trim() };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Python execution error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Map script names to Render service endpoints
function getEndpointForScript(scriptName: string): string | null {
  const mapping: Record<string, string> = {
    'merge_pdf.py': 'pdf-merge',
    'split_pdf.py': 'pdf-split',
    'compress_pdf.py': 'pdf-compress',
    'rotate_pdf.py': 'pdf-rotate',
    'delete_pages.py': 'pdf-delete-pages',
    'protect_pdf.py': 'pdf-protect',
    'unlock_pdf.py': 'pdf-unlock',
    'extract_text.py': 'pdf-extract-text',
    'get_metadata.py': 'pdf-metadata',
    'add_watermark.py': 'pdf-watermark',
  };
  return mapping[scriptName] || null;
}

// Execute via Render Python Service
async function executeViaRenderService(
  scriptName: string,
  args: string[]
): Promise<PythonScriptResult> {
  const endpoint = getEndpointForScript(scriptName);
  
  if (!endpoint) {
    // For scripts without direct Render endpoint, use Supabase Edge Function as fallback
    return {
      success: false,
      error: `Tool '${scriptName}' is not yet available on the cloud service. Please try again later or use the desktop version.`
    };
  }

  try {
    // Read files from args (first arg is usually input file)
    const inputPath = args[0];
    if (!inputPath) {
      return { success: false, error: "No input file provided" };
    }

    // Read the file
    const fileBuffer = await readFile(inputPath);
    const fileName = inputPath.split('/').pop() || 'document.pdf';

    // Create form data
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('files', blob, fileName);

    // Add additional parameters based on script
    if (scriptName === 'split_pdf.py' && args[1]) {
      formData.append('ranges', args[1]);
    }
    if (scriptName === 'rotate_pdf.py' && args[1]) {
      formData.append('degrees', args[1]);
    }
    if (scriptName === 'delete_pages.py' && args[1]) {
      formData.append('pages', args[1]);
    }
    if (scriptName === 'protect_pdf.py' && args[1]) {
      formData.append('password', args[1]);
    }
    if (scriptName === 'unlock_pdf.py' && args[1]) {
      formData.append('password', args[1]);
    }
    if (scriptName === 'add_watermark.py' && args[1]) {
      formData.append('text', args[1]);
    }

    // Call Render service
    const response = await fetch(`${PYTHON_SERVICE_URL}/${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    const contentType = response.headers.get('content-type') || '';

    // Handle binary response (PDF file)
    if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      
      const contentDisposition = response.headers.get('content-disposition') || '';
      let outputFileName = 'output.pdf';
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match) outputFileName = match[1];

      // Save to download directory
      const outputPath = join(DOWNLOAD_DIR, outputFileName);
      await writeFile(outputPath, Buffer.from(arrayBuffer));

      return {
        success: true,
        output: outputPath,
        fileName: outputFileName,
        file_data: base64,
      };
    }

    // Handle JSON response
    const result = await response.json();
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Render service error:", errorMessage);
    return { 
      success: false, 
      error: `PDF processing service unavailable. Please try again later. (${errorMessage})` 
    };
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

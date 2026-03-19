import { NextRequest, NextResponse } from "next/server";
import { readFile, access, unlink } from "fs/promises";
import { join, resolve, normalize } from "path";
import { validateDownloadFilename, addSecurityHeaders } from "@/lib/security";

// Cross-platform download directory
const DOWNLOAD_DIR = join(process.cwd(), "download");

// Allowed file extensions for downloads
const ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "png", "jpg", "jpeg", "gif", "zip"
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Validate and sanitize the filename
    if (!filename || filename.length > 255) {
      const errorResponse = NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    // Validate filename to prevent path traversal
    const validatedPath = validateDownloadFilename(filename, DOWNLOAD_DIR);
    
    if (!validatedPath) {
      const errorResponse = NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    // Check if file exists
    try {
      await access(validatedPath);
    } catch {
      const errorResponse = NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
      return addSecurityHeaders(errorResponse);
    }

    // Read file
    const fileBuffer = await readFile(validatedPath);

    // Determine content type
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    
    // Validate extension
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      const errorResponse = NextResponse.json(
        { error: "File type not allowed" },
        { status: 403 }
      );
      return addSecurityHeaders(errorResponse);
    }

    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      zip: "application/zip",
    };

    const contentType = contentTypes[ext] || "application/octet-stream";

    // Schedule file cleanup after response
    setTimeout(async () => {
      try {
        await unlink(validatedPath);
        console.log("Cleaned up file:", validatedPath);
      } catch (error) {
        console.error("Failed to cleanup file:", error);
      }
    }, 60000); // Clean up after 1 minute

    // Return file with security headers
    const response = new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });

    return addSecurityHeaders(response);
  } catch (error) {
    console.error("Download error:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { readFile, access, unlink } from "fs/promises";
import { join } from "path";

const DOWNLOAD_DIR = "/home/z/my-project/download";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const filePath = join(DOWNLOAD_DIR, filename);

    // Check if file exists
    try {
      await access(filePath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    // Determine content type
    const ext = filename.split(".").pop()?.toLowerCase() || "";
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
        await unlink(filePath);
        console.log("Cleaned up file:", filePath);
      } catch (error) {
        console.error("Failed to cleanup file:", error);
      }
    }, 60000); // Clean up after 1 minute

    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}

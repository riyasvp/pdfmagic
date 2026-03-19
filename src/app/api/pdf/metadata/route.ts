import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";

// GET endpoint to read metadata
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("fileUrl");

    if (!fileUrl) {
      return NextResponse.json(
        { success: false, error: "fileUrl parameter is required" },
        { status: 400 }
      );
    }

    await ensureDirectories();

    // Download the file
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch file" },
        { status: 400 }
      );
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const { writeFile } = await import("fs/promises");
    const { join } = await import("path");
    const { randomUUID } = await import("crypto");

    const UPLOAD_DIR = join(process.cwd(), "upload");
    const fileName = `${randomUUID()}.pdf`;
    const filePath = join(UPLOAD_DIR, fileName);

    await writeFile(filePath, Buffer.from(fileBuffer));

    const result = await executePythonScript("metadata_pdf.py", [filePath]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to read metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("Read metadata error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// POST endpoint to write metadata
export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const title = formData.get("title") as string || "";
    const author = formData.get("author") as string || "";
    const subject = formData.get("subject") as string || "";
    const keywords = formData.get("keywords") as string || "";

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "PDF file is required" },
        { status: 400 }
      );
    }

    const file = files[0];
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "File must be PDF format" },
        { status: 400 }
      );
    }

    const inputPath = await saveUploadedFile(file);

    const result = await executePythonScript("metadata_pdf.py", [
      inputPath,
      title,
      author,
      subject,
      keywords,
    ]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to update metadata" },
        { status: 500 }
      );
    }

    const outputFileName = (result.output as string).split("/").pop();
    const downloadUrl = `/api/download/${outputFileName}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: outputFileName,
    });
  } catch (error) {
    console.error("Write metadata error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

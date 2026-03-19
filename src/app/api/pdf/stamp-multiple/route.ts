import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const stampText = (formData.get("stampText") as string) || "STAMPED";

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "PDF files are required" },
        { status: 400 }
      );
    }

    // Validate all files are PDFs
    for (const file of files) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
          { success: false, error: "All files must be PDF format" },
          { status: 400 }
        );
      }
    }

    // Save uploaded files
    const inputPaths: string[] = [];
    for (const file of files) {
      const filePath = await saveUploadedFile(file);
      inputPaths.push(filePath);
    }

    const filesJson = JSON.stringify(inputPaths);

    const result = await executePythonScript("stamp_multiple_pdf.py", [filesJson, stampText]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to stamp PDFs" },
        { status: 500 }
      );
    }

    const outputFileName = (result.output as string).split("/").pop();
    const downloadUrl = `/api/download/${outputFileName}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: outputFileName,
      stampedCount: result.stampedCount,
      failedCount: result.failedCount,
    });
  } catch (error) {
    console.error("Stamp multiple error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const file = formData.get("files") as File;
    const splitMode = (formData.get("splitMode") as string) || "all";
    const pageRanges = formData.get("pageRanges") as string;
    const pageNumbers = formData.get("pageNumbers") as string;
    const everyPages = formData.get("everyPages") as string;
    const fileCount = formData.get("fileCount") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "File must be PDF format" },
        { status: 400 }
      );
    }

    // Validate parameters based on mode
    if (splitMode === "ranges" && !pageRanges) {
      return NextResponse.json(
        { success: false, error: "Page ranges are required for this mode" },
        { status: 400 }
      );
    }
    if (splitMode === "extract" && !pageNumbers) {
      return NextResponse.json(
        { success: false, error: "Page numbers are required for this mode" },
        { status: 400 }
      );
    }

    // Save uploaded file
    const inputPath = await saveUploadedFile(file);

    // Build command line arguments with parameters
    const scriptArgs = [inputPath, splitMode];
    
    if (pageRanges) {
      scriptArgs.push(`pageRanges=${pageRanges}`);
    }
    if (pageNumbers) {
      scriptArgs.push(`pageNumbers=${pageNumbers}`);
    }
    if (everyPages) {
      scriptArgs.push(`everyPages=${everyPages}`);
    }
    if (fileCount) {
      scriptArgs.push(`fileCount=${fileCount}`);
    }

    // Execute Python script
    const result = await executePythonScript("split_pdf.py", scriptArgs);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to split PDF" },
        { status: 500 }
      );
    }

    const outputFileName = (result.output as string).split("/").pop();
    const downloadUrl = `/api/download/${outputFileName}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: outputFileName,
      filesCount: result.files_count || 1,
    });
  } catch (error) {
    console.error("Split PDF error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

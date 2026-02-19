import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const file = formData.get("files") as File;

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

    // Save uploaded file
    const inputPath = await saveUploadedFile(file);

    // Execute Python script
    const result = await executePythonScript("pdf_to_word.py", [inputPath]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to convert PDF to Word" },
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
    console.error("PDF to Word error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

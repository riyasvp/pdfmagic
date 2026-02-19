import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const file = formData.get("files") as File;
    const textToRedact = formData.get("textToRedact") as string || "";
    const color = formData.get("color") as string || "black";

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

    if (!textToRedact) {
      return NextResponse.json(
        { success: false, error: "Text to redact is required" },
        { status: 400 }
      );
    }

    // Save uploaded file
    const inputPath = await saveUploadedFile(file);

    // Execute Python script
    const result = await executePythonScript("redact_pdf.py", [inputPath, textToRedact, color]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to redact PDF" },
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
    console.error("Redact PDF error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

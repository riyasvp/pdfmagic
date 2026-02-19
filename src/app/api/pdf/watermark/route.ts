import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const file = formData.get("files") as File;
    const watermarkText = formData.get("watermarkText") as string || "WATERMARK";
    const opacity = formData.get("opacity") as string || "0.3";

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
    const result = await executePythonScript("watermark_pdf.py", [inputPath, watermarkText, opacity]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to add watermark" },
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
    console.error("Watermark PDF error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

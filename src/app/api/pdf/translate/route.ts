import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const targetLanguage = (formData.get("targetLanguage") as string) || "en";

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

    // Extract text using Python script
    const result = await executePythonScript("text_pdf.py", [inputPath]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to extract text" },
        { status: 500 }
      );
    }

    // Read the extracted text
    const { readFile } = await import("fs/promises");
    let text = "";
    try {
      text = await readFile(result.output as string, "utf-8");
    } catch {
      text = "Text extraction completed";
    }

    return NextResponse.json({
      success: true,
      originalText: text.substring(0, 10000),
      targetLanguage,
      notice: "Translation powered by AI - configure your AI provider for full functionality",
    });
  } catch (error) {
    console.error("Translate error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

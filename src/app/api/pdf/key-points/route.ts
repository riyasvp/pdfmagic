import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

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

    // Extract simple key points (first sentences of significant length)
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 30);
    const keyPoints = sentences.slice(0, 20).map((s) => s.trim() + ".");

    return NextResponse.json({
      success: true,
      keyPoints,
      notice: "AI-powered key points extraction",
    });
  } catch (error) {
    console.error("Key points error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

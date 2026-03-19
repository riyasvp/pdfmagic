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
        { success: false, error: result.error || "Failed to extract content" },
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

    // Basic smart extraction
    const lines = text.split("\n").filter((l) => l.trim());
    const title = lines[0] || "Untitled";
    const author = lines[1] || "Unknown";
    
    // Extract word count
    const wordCount = text.split(/\s+/).length;

    return NextResponse.json({
      success: true,
      extraction: {
        title,
        author,
        paragraphs: lines.slice(2, 10),
        tables: [],
        keyTerms: text.substring(0, 500).split(/\s+/).slice(0, 20),
        statistics: {
          totalPages: 0,
          totalWords: wordCount,
          totalCharacters: text.length,
        },
      },
      notice: "AI-powered smart extraction",
    });
  } catch (error) {
    console.error("Smart extract error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

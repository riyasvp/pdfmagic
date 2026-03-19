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

    const result = await executePythonScript("text_pdf.py", [inputPath]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to extract text for TTS" },
        { status: 500 }
      );
    }

    // Read the extracted text
    const { readFile } = await import("fs/promises");
    const text = await readFile(result.output as string, "utf-8");

    return NextResponse.json({
      success: true,
      text: text.substring(0, 50000), // Limit text length for TTS
      originalLength: text.length,
      notice: "Use browser Web Speech API for text-to-speech",
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

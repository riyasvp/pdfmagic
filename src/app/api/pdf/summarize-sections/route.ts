import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const startPage = parseInt(formData.get("startPage") as string) || 1;
    const endPage = parseInt(formData.get("endPage") as string) || 10;

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

    // Extract specific pages
    const pageRange = `${startPage}-${endPage}`;
    const result = await executePythonScript("extract_pages_pdf.py", [inputPath, pageRange]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to extract pages" },
        { status: 500 }
      );
    }

    // For now, return a placeholder summary
    return NextResponse.json({
      success: true,
      summary: `Summary of pages ${startPage} to ${endPage}. This is a placeholder - AI summarization requires additional processing.`,
      startPage,
      endPage,
      notice: "AI-powered section summarization",
    });
  } catch (error) {
    console.error("Summarize sections error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

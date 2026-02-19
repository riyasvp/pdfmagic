import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length !== 2) {
      return NextResponse.json(
        { success: false, error: "Exactly 2 PDF files are required for comparison" },
        { status: 400 }
      );
    }

    // Validate both files are PDFs
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

    // Execute Python compare script
    const result = await executePythonScript("compare_pdf.py", inputPaths);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "PDF comparison failed" },
        { status: 500 }
      );
    }

    const outputFileName = (result.output as string).split("/").pop();
    const downloadUrl = `/api/download/${outputFileName}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: outputFileName,
      file1Pages: result.file1_pages,
      file2Pages: result.file2_pages,
      identicalPages: result.identical_pages,
    });
  } catch (error) {
    console.error("Compare PDF error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

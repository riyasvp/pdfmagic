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

    const validTypes = [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];
    const fileName = file.name.toLowerCase();
    
    if (!validTypes.includes(file.type) && !fileName.endsWith(".ppt") && !fileName.endsWith(".pptx")) {
      return NextResponse.json(
        { success: false, error: "File must be PowerPoint format (.ppt or .pptx)" },
        { status: 400 }
      );
    }

    // Save uploaded file
    const inputPath = await saveUploadedFile(file);

    // Execute Python script
    const result = await executePythonScript("ppt_to_pdf.py", [inputPath]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to convert PowerPoint to PDF" },
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
    console.error("PPT to PDF error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

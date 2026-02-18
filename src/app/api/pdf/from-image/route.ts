import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    // Validate all files are images
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp"];
    for (const file of files) {
      const fileName = file.name.toLowerCase();
      const isValidExtension = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].some(ext => fileName.endsWith(ext));
      
      if (!validTypes.includes(file.type) && !isValidExtension) {
        return NextResponse.json(
          { success: false, error: "All files must be image format (JPG, PNG, GIF, BMP, or WebP)" },
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

    // Execute Python script
    const result = await executePythonScript("image_to_pdf.py", inputPaths);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to convert images to PDF" },
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
    console.error("Image to PDF error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

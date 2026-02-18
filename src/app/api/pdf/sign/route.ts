import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const file = formData.get("files") as File;
    const signatureText = formData.get("signatureText") as string || "";
    const signatureImage = formData.get("signatureImage") as File | null;
    const position = formData.get("position") as string || "bottom-right";

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

    let signatureImagePath = "";
    if (signatureImage) {
      signatureImagePath = await saveUploadedFile(signatureImage);
    }

    // Execute Python script
    const result = await executePythonScript("sign_pdf.py", [
      inputPath,
      signatureText,
      signatureImagePath,
      position
    ]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to sign PDF" },
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
    console.error("Sign PDF error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

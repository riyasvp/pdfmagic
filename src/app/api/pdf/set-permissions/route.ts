import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const password = (formData.get("password") as string) || "";
    const canPrint = formData.get("canPrint") !== "false";
    const canCopy = formData.get("canCopy") !== "false";
    const canEdit = formData.get("canEdit") === "true";

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

    const result = await executePythonScript("permissions_pdf.py", [
      inputPath,
      password,
      String(canPrint),
      String(canCopy),
      String(canEdit),
    ]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to set permissions" },
        { status: 500 }
      );
    }

    const outputFileName = (result.output as string).split("/").pop();
    const downloadUrl = `/api/download/${outputFileName}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: outputFileName,
      permissions: result.permissions,
    });
  } catch (error) {
    console.error("Set permissions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

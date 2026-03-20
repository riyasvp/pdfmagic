import { NextRequest, NextResponse } from "next/server";
import {
  saveUploadedFile,
  executePythonScript,
  ensureDirectories,
  cleanupFile,
} from "@/lib/pdf-processor";
import { uploadToSupabase } from "@/lib/supabase-upload";
import { getUserFromRequest } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  const inputPaths: string[] = [];
  let outputPath: string | null = null;

  try {
    // 1. Auth check
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    await ensureDirectories();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const stampText = (formData.get("stampText") as string) || "STAMPED";

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "PDF files are required" },
        { status: 400 }
      );
    }

    // Validate all files are PDFs
    for (const file of files) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
          { success: false, error: "All files must be PDF format" },
          { status: 400 }
        );
      }
    }

    // Save uploaded files
    for (const file of files) {
      const filePath = await saveUploadedFile(file);
      inputPaths.push(filePath);
    }

    const filesJson = JSON.stringify(inputPaths);

    const result = await executePythonScript("stamp_multiple_pdf.py", [filesJson, stampText]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to stamp PDFs" },
        { status: 500 }
      );
    }

    outputPath = result.output as string;

    // Upload to Supabase
    const pathParts = outputPath.split(/[\\/]/);
    const outputFileName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : `stamped_${Date.now()}.pdf`;

    const { url, error } = await uploadToSupabase(outputPath, outputFileName, user.id);

    if (error || !url) {
      return NextResponse.json(
        { success: false, error: "Upload failed: " + (error || "Unknown error") },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      downloadUrl: url,
      fileName: outputFileName,
      stampedCount: result.stampedCount,
      failedCount: result.failedCount,
    });
  } catch (error) {
    console.error("Stamp multiple error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  } finally {
    for (const path of inputPaths) {
      await cleanupFile(path);
    }
    if (outputPath) await cleanupFile(outputPath);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories, cleanupFile } from "@/lib/pdf-processor";
import { uploadToSupabase } from "@/lib/supabase-upload";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { basename } from "path";

export async function POST(request: NextRequest) {
  let inputPaths: string[] = [];
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

    // 2. Parse form data
    await ensureDirectories();
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length < 2) {
      return NextResponse.json(
        { success: false, error: "At least 2 PDF files are required" },
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

    // 3. Save uploaded files
    for (const file of files) {
      const filePath = await saveUploadedFile(file);
      inputPaths.push(filePath);
    }

    // 4. Execute Python script
    const result = await executePythonScript("merge_pdf.py", inputPaths);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to merge PDFs" },
        { status: 500 }
      );
    }

    outputPath = result.output as string;
    if (!outputPath) {
      return NextResponse.json(
        { success: false, error: "Invalid output path from script" },
        { status: 500 }
      );
    }

    // 5. Upload to Supabase
    const outputFileName = basename(outputPath) || `merged_${Date.now()}.pdf`;
    const { url, error } = await uploadToSupabase(outputPath, outputFileName, user.id);

    if (error || !url) {
      return NextResponse.json(
        { success: false, error: "Upload failed: " + (error || "Unknown error") },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, downloadUrl: url, fileName: outputFileName });

  } catch (error) {
    console.error("Merge PDF error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  } finally {
    for (const p of inputPaths) {
      await cleanupFile(p);
    }
    if (outputPath) await cleanupFile(outputPath);
  }
}

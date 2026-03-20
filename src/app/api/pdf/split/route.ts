import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories, cleanupFile } from "@/lib/pdf-processor";
import { uploadToSupabase } from "@/lib/supabase-upload";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { basename } from "path";

export async function POST(request: NextRequest) {
  let inputPath: string | null = null;
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
    const file = formData.get("files") as File;
    const splitMode = (formData.get("splitMode") as string) || "all";
    const pageRanges = formData.get("pageRanges") as string;
    const pageNumbers = formData.get("pageNumbers") as string;
    const everyPages = formData.get("everyPages") as string;
    const fileCount = formData.get("fileCount") as string;

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

    // Validate parameters based on mode
    if (splitMode === "ranges" && !pageRanges) {
      return NextResponse.json(
        { success: false, error: "Page ranges are required for this mode" },
        { status: 400 }
      );
    }
    if (splitMode === "extract" && !pageNumbers) {
      return NextResponse.json(
        { success: false, error: "Page numbers are required for this mode" },
        { status: 400 }
      );
    }

    // 3. Save uploaded file
    inputPath = await saveUploadedFile(file);

    // 4. Build command line arguments with parameters
    const scriptArgs = [inputPath, splitMode];
    
    if (pageRanges) {
      scriptArgs.push(`pageRanges=${pageRanges}`);
    }
    if (pageNumbers) {
      scriptArgs.push(`pageNumbers=${pageNumbers}`);
    }
    if (everyPages) {
      scriptArgs.push(`everyPages=${everyPages}`);
    }
    if (fileCount) {
      scriptArgs.push(`fileCount=${fileCount}`);
    }

    // Execute Python script
    const result = await executePythonScript("split_pdf.py", scriptArgs);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to split PDF" },
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
    const outputFileName = basename(outputPath) || `split_${Date.now()}.pdf`;
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
      filesCount: result.files_count || 1,
    });

  } catch (error) {
    console.error("Split PDF error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  } finally {
    if (inputPath) await cleanupFile(inputPath);
    if (outputPath) await cleanupFile(outputPath);
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  ensureDirectories,
  saveUploadedFile,
  executePythonScript,
  cleanupFile,
} from "@/lib/pdf-processor";
import { uploadToSupabase } from "@/lib/supabase-upload";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { basename } from "path";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

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
    const file = formData.get("files") as File | null;
    const quality = (formData.get("quality") as string) || "medium";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "File must be PDF format" },
        { status: 400 }
      );
    }

    // 3. Save uploaded file
    inputPath = await saveUploadedFile(file);

    // 4. Execute Python script
    const result = await executePythonScript("compress_pdf.py", [inputPath, quality]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Compression failed" },
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
    const outputFileName = basename(outputPath);
    const { url, error } = await uploadToSupabase(outputPath, outputFileName, user.id);

    if (error || !url) {
      return NextResponse.json(
        { success: false, error: "Upload failed: " + (error || "Unknown error") },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, downloadUrl: url, fileName: outputFileName });

  } catch (err) {
    console.error("Compress PDF error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  } finally {
    if (inputPath) await cleanupFile(inputPath);
    if (outputPath) await cleanupFile(outputPath);
  }
}

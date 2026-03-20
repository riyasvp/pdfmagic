import { NextRequest, NextResponse } from "next/server";
import {
  ensureDirectories,
  saveUploadedFile,
  executePythonScript,
  cleanupFile,
} from "@/lib/pdf-processor";
import { uploadToSupabase } from "@/lib/supabase-upload";
import { getUserFromRequest } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    // 1. Auth check
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Parse form data
    await ensureDirectories();
    const formData = await request.formData();
    const file = formData.get("files") as File | null;

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

    // 3. Extract watermark options
    const watermarkText = formData.get("watermarkText") as string || "WATERMARK";
    const opacity = formData.get("opacity") as string || "0.3";

    // 4. Save uploaded file
    inputPath = await saveUploadedFile(file);

    // 5. Execute Python script
    const result = await executePythonScript("watermark_pdf.py", [inputPath, watermarkText, opacity]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to add watermark" },
        { status: 500 }
      );
    }

    outputPath = result.output as string;

    // 6. Upload to Supabase
    const pathParts = outputPath.split(/[\\/]/);
    const outputFileName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : `watermarked_${Date.now()}.pdf`;

    const { url, error } = await uploadToSupabase(outputPath, outputFileName, user.id);

    if (error || !url) {
      return NextResponse.json(
        { success: false, error: "Upload failed: " + (error || "Unknown error") },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, downloadUrl: url, fileName: outputFileName });

  } catch (err) {
    console.error("Watermark PDF error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  } finally {
    if (inputPath) await cleanupFile(inputPath);
    if (outputPath) await cleanupFile(outputPath);
  }
}

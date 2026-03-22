import { NextRequest, NextResponse } from "next/server";
import { ensureDirectories, saveUploadedFile, executePythonScript, cleanupFile } from "@/lib/pdf-processor";
import { uploadToSupabase } from "@/lib/supabase-upload";
import { getUserFromRequest } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    // 1. Auth check - allow demo mode or authenticated users
    const user = await getUserFromRequest();

    // For demo mode, create a mock user
    const demoUser = user || {
      id: 'demo-user',
      email: 'demo@pdfmagic.store'
    };

    console.log('[PDF to Excel] User:', user?.id || 'demo-user', 'Demo mode:', !user);

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

    // 3. Save uploaded file
    inputPath = await saveUploadedFile(file);

    // 4. Execute Python script
    const result = await executePythonScript("pdf_to_excel.py", [inputPath]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to convert PDF to Excel" },
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
    const outputFileName = `converted_${Date.now()}.xlsx`;

    const { url, error } = await uploadToSupabase(outputPath, outputFileName, demoUser.id);

    if (error || !url) {
      return NextResponse.json(
        { success: false, error: "Upload failed: " + (error || "Unknown error") },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, downloadUrl: url, fileName: outputFileName });

  } catch (err) {
    console.error("PDF to Excel error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: "Server error: " + errorMessage },
      { status: 500 }
    );
  } finally {
    if (inputPath) await cleanupFile(inputPath);
    if (outputPath) await cleanupFile(outputPath);
  }
}

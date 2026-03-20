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
    const files = formData.getAll("files") as File[];
    const operations = formData.get("operations") as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "PDF file is required" },
        { status: 400 }
      );
    }

    const file = files[0];

    // Validate file is PDF
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "File must be PDF format" },
        { status: 400 }
      );
    }

    // 3. Save uploaded file
    inputPath = await saveUploadedFile(file);

    // Default operations if not provided
    const ops = operations || JSON.stringify({});

    // 4. Execute Python organize script
    const result = await executePythonScript("organize_pdf.py", [inputPath, ops]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "PDF organization failed" },
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
    const outputFileName = basename(outputPath) || `organized_${Date.now()}.pdf`;
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
      originalPages: result.original_pages,
      newPages: result.new_pages,
    });

  } catch (error) {
    console.error("Organize PDF error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  } finally {
    if (inputPath) await cleanupFile(inputPath);
    if (outputPath) await cleanupFile(outputPath);
  }
}

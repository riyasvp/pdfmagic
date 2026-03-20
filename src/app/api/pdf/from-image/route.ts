import { NextRequest, NextResponse } from "next/server";
import {
  ensureDirectories,
  saveUploadedFile,
  executePythonScript,
  cleanupFile,
} from "@/lib/pdf-processor";
import { uploadToSupabase } from "@/lib/supabase-upload";
import { getUserFromRequest } from "@/lib/supabase-auth";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp"];
const VALID_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];

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

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    // Validate all files are images
    for (const file of files) {
      const fileName = file.name.toLowerCase();
      const isValidExtension = VALID_EXTENSIONS.some((ext) => fileName.endsWith(ext));

      if (!VALID_IMAGE_TYPES.includes(file.type) && !isValidExtension) {
        return NextResponse.json(
          { success: false, error: "All files must be image format (JPG, PNG, GIF, BMP, or WebP)" },
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
    const result = await executePythonScript("image_to_pdf.py", inputPaths);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Conversion failed" },
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
    const pathParts = outputPath.split(/[\\/]/);
    const outputFileName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : `converted_${Date.now()}.pdf`;

    const { url, error } = await uploadToSupabase(outputPath, outputFileName, user.id);

    if (error || !url) {
      return NextResponse.json(
        { success: false, error: "Upload failed: " + (error || "Unknown error") },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, downloadUrl: url, fileName: outputFileName });

  } catch (err) {
    console.error("Image to PDF error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  } finally {
    for (const path of inputPaths) {
      await cleanupFile(path);
    }
    if (outputPath) await cleanupFile(outputPath);
  }
}

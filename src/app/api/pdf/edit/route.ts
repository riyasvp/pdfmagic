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
const PDF_MIME_TYPE = "application/pdf";

export async function POST(request: NextRequest) {
  let localPath: string | null = null;
  let editedPath: string | null = null;

  try {
    await ensureDirectories();

    // Get authenticated user FIRST, before any expensive operations
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("files") as File | null;
    const editType = (formData.get("editType") as string) ?? "watermark";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== PDF_MIME_TYPE) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only PDF files are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 50 MB." },
        { status: 400 }
      );
    }

    localPath = await saveUploadedFile(file);

    const scriptMap: Record<string, string> = {
      watermark: "watermark_pdf.py",
      rotate: "rotate_pdf.py",
    };

    const script = scriptMap[editType];
    if (!script) {
      return NextResponse.json(
        { success: false, error: "Unsupported edit type" },
        { status: 400 }
      );
    }

    const result = await executePythonScript(script, [localPath]);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Edit failed" },
        { status: 500 }
      );
    }

    editedPath = (result.output as string) ?? "";
    if (!editedPath) {
      return NextResponse.json(
        { success: false, error: "Invalid output path from script" },
        { status: 500 }
      );
    }

    const pathParts = editedPath.split(/[\\/]/);
    const editedFileName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : null;

    if (!editedFileName || editedFileName.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Failed to extract file name from path" },
        { status: 500 }
      );
    }

    const { url: downloadUrl, error: uploadError } = await uploadToSupabase(
      editedPath,
      editedFileName,
      user.id
    );

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: "Supabase upload failed: " + uploadError },
        { status: 500 }
      );
    }

    if (!downloadUrl) {
      return NextResponse.json(
        { success: false, error: "Failed to get download URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: editedFileName,
    });
  } catch (err) {
    console.error("PDF edit error:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected server error" },
      { status: 500 }
    );
  } finally {
    if (localPath) {
      await cleanupFile(localPath);
    }
    if (editedPath) {
      await cleanupFile(editedPath);
    }
  }
}

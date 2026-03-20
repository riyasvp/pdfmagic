import { NextRequest, NextResponse } from "next/server";
import {
  saveUploadedFile,
  executePythonScript,
  ensureDirectories,
  cleanupFile,
} from "@/lib/pdf-processor";
import { getUserFromRequest } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  let inputPath: string | null = null;

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

    inputPath = await saveUploadedFile(file);

    const result = await executePythonScript("validate_pdf.py", [inputPath]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to validate PDF" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      validation: result.validation,
    });
  } catch (error) {
    console.error("Validate PDF error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  } finally {
    if (inputPath) await cleanupFile(inputPath);
  }
}

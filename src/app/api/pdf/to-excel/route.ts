import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check - allow demo mode or authenticated users
    const user = await getUserFromRequest();
    const userId = user?.id || 'demo-user';

    // 2. Parse form data
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

    // 3. Upload to Supabase Storage first
    const filePath = `uploads/${userId}/${Date.now()}_${file.name}`;
    const fileBuffer = await file.arrayBuffer();

    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/pdf-edits/${filePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/pdf',
          'x-upsert': 'true',
        },
        body: fileBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('Upload error:', error);
      return NextResponse.json(
        { success: false, error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // 4. Call Supabase Edge Function for processing
    const functionResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/pdf-to-excel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: filePath,
          user_id: userId,
          file_name: file.name,
          tool: 'pdf-to-excel',
        }),
      }
    );

    const result = await functionResponse.json();

    if (!functionResponse.ok || !result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Processing failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      downloadUrl: result.downloadUrl,
      fileName: result.fileName,
      tablesExtracted: result.tablesExtracted || 0,
    });

  } catch (err) {
    console.error("PDF to Excel error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: "Server error: " + errorMessage },
      { status: 500 }
    );
  }
}

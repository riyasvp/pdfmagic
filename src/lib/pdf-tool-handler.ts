import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ToolOptions {
  tool: string;
  requiresAuth?: boolean;
  allowedTypes?: string[];
  options?: Record<string, unknown>;
}

export async function handlePdfTool(request: NextRequest, config: ToolOptions) {
  try {
    // Auth check
    const user = await getUserFromRequest();
    const userId = user?.id || 'demo-user';

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("files") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = config.allowedTypes || ['application/pdf'];
    const isAllowed = allowedTypes.some(type => 
      file.type === type || file.name.toLowerCase().endsWith(type.replace('application/', '.'))
    );

    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: `File must be one of: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const filePath = `uploads/${userId}/${Date.now()}_${file.name}`;
    const fileBuffer = await file.arrayBuffer();

    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/pdf-edits/${filePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': file.type || 'application/pdf',
          'x-upsert': 'true',
        },
        body: fileBuffer,
      }
    );

    if (!uploadResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Call Edge Function
    const functionResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/pdf-tool`,
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
          tool: config.tool,
          options: config.options,
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
      processedBy: result.processedBy,
    });

  } catch (err) {
    console.error(`${config.tool} error:`, err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: "Server error: " + errorMessage },
      { status: 500 }
    );
  }
}

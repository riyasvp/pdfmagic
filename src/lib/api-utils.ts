import { NextRequest, NextResponse } from "next/server";
import {
  ensureDirectories,
  saveUploadedFile,
  executePythonScript,
  cleanupFile,
} from "@/lib/pdf-processor";
import { uploadToSupabase } from "@/lib/supabase-upload";
import {
  getUserFromRequest,
  isDemoMode,
  checkDemoRateLimit,
} from "@/lib/supabase-auth";
import {
  validateDemoFileSize,
  getDemoFileSizeLimit,
  DEMO_CONFIG,
} from "@/lib/demo-utils";

export interface ApiRouteOptions {
  scriptName: string;
  requireMultipleFiles?: boolean;
  minFiles?: number;
  additionalParams?: string[];
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return "unknown";
}

export async function handlePdfApiRoute(
  request: NextRequest,
  options: ApiRouteOptions
): Promise<NextResponse> {
  let inputPaths: string[] = [];
  let outputPath: string | null = null;
  const {
    scriptName,
    requireMultipleFiles = false,
    minFiles = 2,
    additionalParams = [],
  } = options;

  try {
    // 1. Auth check
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please sign in to continue." },
        { status: 401 }
      );
    }

    // 2. Demo mode checks
    if (user.isDemoUser || isDemoMode()) {
      const clientIp = getClientIp(request);
      const rateLimitResult = checkDemoRateLimit(clientIp);

      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Demo rate limit exceeded. Please wait ${Math.ceil(rateLimitResult.resetIn / 1000)} seconds.`,
            retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
          },
          { status: 429 }
        );
      }
    }

    // 3. Parse form data
    await ensureDirectories();
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    // 4. Validate files
    if (requireMultipleFiles) {
      if (!files || files.length < minFiles) {
        return NextResponse.json(
          { success: false, error: `At least ${minFiles} PDF files are required` },
          { status: 400 }
        );
      }
    } else {
      if (!files || files.length === 0) {
        return NextResponse.json(
          { success: false, error: "PDF file is required" },
          { status: 400 }
        );
      }
    }

    // 5. Validate each file
    for (const file of files) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
          { success: false, error: "All files must be PDF format" },
          { status: 400 }
        );
      }

      // Demo mode file size check
      if (user.isDemoUser) {
        if (!validateDemoFileSize(file.size)) {
          return NextResponse.json(
            {
              success: false,
              error: `File size exceeds demo limit of ${getDemoFileSizeLimit()}`,
              maxFileSize: DEMO_CONFIG.maxFileSize,
            },
            { status: 400 }
          );
        }
      }
    }

    // 6. Save uploaded files
    for (const file of files) {
      const filePath = await saveUploadedFile(file);
      inputPaths.push(filePath);
    }

    // 7. Extract additional parameters
    const scriptArgs: string[] = [...inputPaths];
    for (const param of additionalParams) {
      const value = formData.get(param) as string;
      if (value) {
        scriptArgs.push(value);
      }
    }

    // 8. Execute Python script
    const result = await executePythonScript(scriptName, scriptArgs);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Processing failed" },
        { status: 500 }
      );
    }

    outputPath = result.output as string;
    if (!outputPath) {
      return NextResponse.json(
        { success: false, error: "Invalid output from processing" },
        { status: 500 }
      );
    }

    // 9. Upload to Supabase
    const pathParts = outputPath.split(/[\\/]/);
    const outputFileName = pathParts[pathParts.length - 1] || `processed_${Date.now()}.pdf`;
    const { url, error } = await uploadToSupabase(outputPath, outputFileName, user.id);

    if (error || !url) {
      return NextResponse.json(
        { success: false, error: "Upload failed: " + (error || "Please try again") },
        { status: 500 }
      );
    }

    // 10. Return success response
    return NextResponse.json({
      success: true,
      downloadUrl: url,
      fileName: outputFileName,
      ...result,
    });

  } catch (err) {
    console.error(`${scriptName} error:`, err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  } finally {
    // 11. Cleanup
    for (const p of inputPaths) {
      await cleanupFile(p);
    }
    if (outputPath) {
      await cleanupFile(outputPath);
    }
  }
}

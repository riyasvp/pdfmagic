import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, executePythonScript, ensureDirectories } from "@/lib/pdf-processor";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const tool = formData.get("tool") as string;
    const options = formData.get("options") as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one file is required" },
        { status: 400 }
      );
    }

    if (!tool) {
      return NextResponse.json(
        { success: false, error: "Tool name is required" },
        { status: 400 }
      );
    }

    // Map tool names to scripts
    const toolScripts: Record<string, string> = {
      "watermark": "watermark_pdf.py",
      "compress": "compress_pdf.py",
      "rotate": "rotate_pdf.py",
      "grayscale": "grayscale_pdf.py",
      "optimize": "optimize_pdf.py",
      "flatten": "flatten_pdf.py",
      "repair": "repair_pdf.py",
      "embed-fonts": "embed_fonts_pdf.py",
    };

    const scriptName = toolScripts[tool];
    if (!scriptName) {
      return NextResponse.json(
        { success: false, error: `Unknown tool: ${tool}` },
        { status: 400 }
      );
    }

    const results: { file: string; success: boolean; output?: string; error?: string }[] = [];
    const SCRIPTS_DIR = join(process.cwd(), "scripts");

    // Process each file
    for (const file of files) {
      try {
        const inputPath = await saveUploadedFile(file);

        const args = [inputPath];
        if (options) {
          args.push(options);
        }

        const scriptPath = join(SCRIPTS_DIR, scriptName);
        const { stdout } = await execAsync(
          `python3 "${scriptPath}" ${args.map((a) => `"${a}"`).join(" ")}`,
          { timeout: 120000 }
        );

        const result = JSON.parse(stdout.trim());
        if (result.success) {
          results.push({
            file: file.name,
            success: true,
            output: result.output,
          });
        } else {
          results.push({
            file: file.name,
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        results.push({
          file: file.name,
          success: false,
          error: error instanceof Error ? error.message : "Processing failed",
        });
      }
    }

    const successfulCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      totalFiles: files.length,
      successfulCount,
      failedCount: files.length - successfulCount,
      results,
    });
  } catch (error) {
    console.error("Batch process error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

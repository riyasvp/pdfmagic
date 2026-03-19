import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, ensureDirectories, cleanupFile } from "@/lib/pdf-processor";
import { exec } from "child_process";
import { promisify } from "util";
import { getUserFromRequest } from "@/lib/supabase-auth";
import ZAI from "z-ai-web-dev-sdk";

const execAsync = promisify(exec);

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const PDF_MIME_TYPE = "application/pdf";

async function extractPdfText(inputPath: string): Promise<string> {
  try {
    // Use py -3 on Windows, python3 on Unix
    const pythonCmd = process.platform === "win32" ? "py -3" : "python3";
    const { stdout } = await execAsync(
      `${pythonCmd} -c "
import sys
try:
    import pdfplumber
    with pdfplumber.open('${inputPath}') as pdf:
        text = ''
        for page in pdf.pages:
            page_text = page.extract_text() or ''
            text += page_text + '\\n\\n'
        print(text[:15000])  # Limit text size
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
"`
    );
    return stdout.trim();
  } catch (error) {
    console.error("Text extraction error:", error);
    return "";
  }
}

export async function POST(request: NextRequest) {
  let localPath: string | null = null;

  try {
    // 1. Auth check FIRST
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
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

    // Validate file is PDF
    if (file.type !== PDF_MIME_TYPE && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "File must be PDF format" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large (max 50MB)" },
        { status: 400 }
      );
    }

    // Save uploaded file
    localPath = await saveUploadedFile(file);

    // Extract text from PDF
    const pdfText = await extractPdfText(localPath);

    if (!pdfText || pdfText.length < 50) {
      return NextResponse.json(
        { success: false, error: "Could not extract text from PDF or PDF is empty" },
        { status: 400 }
      );
    }

    // Use AI to summarize
    const zai = await ZAI.create();
    
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert document analyst. Create a comprehensive summary of the provided PDF document content. 
          
Structure your summary as follows:
1. **Document Overview** - Brief description of what the document is about
2. **Key Points** - Main points or findings (bullet points)
3. **Important Details** - Specific data, numbers, or facts mentioned
4. **Conclusions** - Main conclusions or recommendations if any

Keep the summary concise but informative. Focus on the most important information.`
        },
        {
          role: "user",
          content: `Please summarize this PDF document:\n\n${pdfText}`
        }
      ],
    });

    const summary = completion.choices[0]?.message?.content || "Failed to generate summary";

    return NextResponse.json({
      success: true,
      summary,
      fileName: file.name,
      textLength: pdfText.length,
    });
  } catch (error) {
    console.error("Summarize PDF error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  } finally {
    if (localPath) await cleanupFile(localPath);
  }
}

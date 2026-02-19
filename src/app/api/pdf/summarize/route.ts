import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, ensureDirectories } from "@/lib/pdf-processor";
import { exec } from "child_process";
import { promisify } from "util";
import ZAI from "z-ai-web-dev-sdk";

const execAsync = promisify(exec);

const SCRIPTS_DIR = "/home/z/my-project/scripts";

async function extractPdfText(inputPath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `python3 -c "
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
  try {
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
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "File must be PDF format" },
        { status: 400 }
      );
    }

    // Save uploaded file
    const inputPath = await saveUploadedFile(file);

    // Extract text from PDF
    const pdfText = await extractPdfText(inputPath);

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
  }
}

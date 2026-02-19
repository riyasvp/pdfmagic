import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, ensureDirectories } from "@/lib/pdf-processor";
import { exec } from "child_process";
import { promisify } from "util";
import ZAI from "z-ai-web-dev-sdk";

const execAsync = promisify(exec);

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

    const body = await request.json();
    const { fileId, question, pdfText: cachedText } = body;

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Question is required" },
        { status: 400 }
      );
    }

    let pdfText = cachedText;

    // If we have a fileId but no cached text, extract it
    if (!pdfText && fileId) {
      const inputPath = `/home/z/my-project/upload/${fileId}`;
      pdfText = await extractPdfText(inputPath);
    }

    if (!pdfText || pdfText.length < 50) {
      return NextResponse.json(
        { success: false, error: "Could not extract text from PDF or PDF is empty" },
        { status: 400 }
      );
    }

    // Use AI to answer question
    const zai = await ZAI.create();
    
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an intelligent document assistant. You have access to the content of a PDF document. 
          
Answer questions about the document accurately and helpfully. If the answer cannot be found in the document, say so clearly.

When answering:
- Be specific and reference relevant parts of the document
- Quote important text when appropriate
- If you're unsure, acknowledge the uncertainty
- Keep answers concise but complete`
        },
        {
          role: "user",
          content: `Document content:\n${pdfText}\n\n---\n\nQuestion: ${question}`
        }
      ],
    });

    const answer = completion.choices[0]?.message?.content || "Failed to generate answer";

    return NextResponse.json({
      success: true,
      answer,
      question,
    });
  } catch (error) {
    console.error("Chat PDF error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

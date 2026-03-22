import { NextRequest, NextResponse } from "next/server";

const PYTHON_REQUIRED = {
  success: false,
  error: "This tool requires Python processing. Please use our AI-powered alternatives:",
  alternatives: [
    "PDF to Text - Extract all text content",
    "PDF Summarize - Get document summary", 
    "Smart Extract - Extract structured data"
  ],
  suggestedTools: ["/tool/text", "/tool/summarize", "/tool/smart-extract"]
};

export async function POST(request: NextRequest) {
  return NextResponse.json(PYTHON_REQUIRED, { status: 501 });
}

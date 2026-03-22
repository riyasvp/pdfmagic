import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: "This tool requires Python processing.",
    alternatives: ["Use OCR for text extraction"],
    suggestedTools: ["/tool/ocr"]
  }, { status: 501 });
}

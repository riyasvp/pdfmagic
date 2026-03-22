import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: "This tool requires Python processing.",
    alternatives: ["Upload a PDF file directly", "Use PDF to Text for extraction"],
    suggestedTools: ["/tool/text"]
  }, { status: 501 });
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: "This tool requires Python processing which is not available on serverless.",
    alternatives: [
      "Use PDF to Text to extract content",
      "Use PDF to Excel for table extraction"
    ],
    suggestedTools: ["/tool/text", "/tool/to-excel"]
  }, { status: 501 });
}

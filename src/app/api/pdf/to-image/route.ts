import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: "This tool requires Python processing which is not available on serverless. Alternative options:",
    alternatives: [
      "Use the PDF to Text tool and copy the content",
      "Use a desktop PDF editor",
      "Contact support for enterprise solutions"
    ],
    suggestedTool: "/tool/text"
  }, { status: 501 });
}

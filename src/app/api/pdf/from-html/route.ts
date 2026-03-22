import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: "This tool requires Python processing.",
    alternatives: ["Use PDF to HTML to convert PDF to HTML"],
    suggestedTools: ["/tool/html"]
  }, { status: 501 });
}

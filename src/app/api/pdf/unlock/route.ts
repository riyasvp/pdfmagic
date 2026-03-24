import { NextRequest, NextResponse } from "next/server";
import { handlePdfApiRoute } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  return handlePdfApiRoute(request, {
    scriptName: "unlock_pdf.py",
    additionalParams: ["password"],
  });
}
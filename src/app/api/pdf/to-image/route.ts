import { NextRequest, NextResponse } from "next/server";
import { handlePdfApiRoute } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  return handlePdfApiRoute(request, {
    scriptName: "pdf_to_image.py",
  });
}
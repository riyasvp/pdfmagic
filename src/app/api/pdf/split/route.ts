import { NextRequest, NextResponse } from "next/server";
import { handlePdfApiRoute } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  return handlePdfApiRoute(request, {
    scriptName: "split_pdf.py",
    additionalParams: ["splitMode", "pageRanges", "pageNumbers", "everyPages", "fileCount"],
  });
}
import { NextRequest } from "next/server";
import { handlePdfApiRoute } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  return handlePdfApiRoute(request, {
    scriptName: "quality_pdf.py",
    additionalParams: ["quality"],
  });
}

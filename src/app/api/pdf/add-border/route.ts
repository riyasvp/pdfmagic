import { NextRequest } from "next/server";
import { handlePdfApiRoute } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  return handlePdfApiRoute(request, {
    scriptName: "border_pdf.py",
    additionalParams: ["borderWidth", "borderColor", "margin"],
  });
}

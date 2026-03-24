import { NextRequest } from "next/server";
import { handlePdfApiRoute } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  return handlePdfApiRoute(request, {
    scriptName: "sign_pdf.py",
    additionalParams: ["signatureText", "signatureImage", "position"],
  });
}

import { NextRequest } from "next/server";
import { handlePdfApiRoute } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  return handlePdfApiRoute(request, {
    scriptName: "permissions_pdf.py",
    additionalParams: ["password", "canPrint", "canCopy", "canEdit"],
  });
}

import { NextRequest } from "next/server";
import { handlePdfTool } from "@/lib/pdf-tool-handler";

export async function POST(request: NextRequest) {
  return handlePdfTool(request, { tool: 'redact' });
}

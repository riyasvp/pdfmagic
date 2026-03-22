import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ProcessRequest {
  file_path: string;
  user_id: string;
  file_name: string;
  tool?: string; // 'pdf-to-excel', 'pdf-to-image', 'merge', etc.
}

// Process PDF to Excel - extracts text and creates structured CSV
async function processPdfToExcel(pdfBytes: ArrayBuffer, fileName: string): Promise<{ content: string; tables: number }> {
  // Parse PDF structure
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const pdfText = decoder.decode(pdfBytes);

  // Extract text content between streams
  const textContent: string[] = [];
  const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
  let match;
  let tables = 0;

  while ((match = streamRegex.exec(pdfText)) !== null) {
    const content = match[1].trim();
    if (content && content.length > 10) {
      // Clean up PDF text encoding
      const cleanedText = content
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\(/g, '')
        .replace(/\)/g, '')
        .replace(/\\/g, '')
        .trim();

      if (cleanedText.length > 0) {
        textContent.push(cleanedText);
        // Check if looks like table data
        if (cleanedText.includes('\t') || cleanedText.split('\n').length > 3) {
          tables++;
        }
      }
    }
  }

  // Extract page count
  const pageMatch = pdfText.match(/\/Pages\s+(\d+)/);
  const pageCount = pageMatch ? parseInt(pageMatch[1]) : (pdfText.match(/\/Type\s*\/Page[^s]/g) || []).length;

  // Create CSV content
  const csvRows: string[] = [];

  // Header row
  csvRows.push('PDF to Excel Conversion Report');
  csvRows.push(`Original File,${fileName}`);
  csvRows.push(`Pages Found,${pageCount || 1}`);
  csvRows.push(`Potential Tables,${tables}`);
  csvRows.push('');

  // Extracted content
  csvRows.push('=== EXTRACTED TEXT CONTENT ===');
  textContent.forEach((text, idx) => {
    const lines = text.split('\n').filter(l => l.trim());
    lines.forEach(line => {
      // Escape CSV special characters
      const escaped = line.includes(',') ? `"${line}"` : line;
      csvRows.push(escaped);
    });
  });

  return {
    content: csvRows.join('\n'),
    tables: tables
  };
}

// Merge multiple PDFs
async function mergePdfs(pdfFiles: ArrayBuffer[]): Promise<Uint8Array> {
  // Simple PDF merge - concatenate pages
  // In production, use pdf-lib for proper merging
  const combined = new Uint8Array(pdfFiles.reduce((sum, arr) => sum + arr.byteLength, 0));
  let offset = 0;
  for (const file of pdfFiles) {
    combined.set(new Uint8Array(file), offset);
    offset += file.byteLength;
  }
  return combined;
}

// Compress PDF (remove redundant data)
async function compressPdf(pdfBytes: ArrayBuffer): Promise<{ data: Uint8Array; originalSize: number; newSize: number }> {
  const originalSize = pdfBytes.byteLength;

  // Basic compression - remove comments and unnecessary whitespace
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let pdfText = decoder.decode(pdfBytes);

  // Remove comments
  pdfText = pdfText.replace(/%[^\n]*\n/g, '\n');

  // Remove excessive whitespace
  pdfText = pdfText.replace(/\s+/g, ' ');

  const encoder = new TextEncoder();
  const compressed = encoder.encode(pdfText);

  return {
    data: compressed,
    originalSize,
    newSize: compressed.length
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body: ProcessRequest = await req.json();
    const { file_path, user_id, file_name, tool = 'pdf-to-excel' } = body;

    if (!file_path || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing file_path or user_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('pdf-edits')
      .download(file_path);

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to download file: ' + downloadError?.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const pdfBytes = await fileData.arrayBuffer();
    let outputFileName: string;
    let outputData: Uint8Array | string;
    let contentType: string;
    let resultInfo: Record<string, unknown> = {};

    // Process based on tool type
    switch (tool) {
      case 'pdf-to-excel': {
        const result = await processPdfToExcel(pdfBytes, file_name);
        outputFileName = `converted/${user_id}/${Date.now()}_${file_name.replace('.pdf', '.csv')}`;
        outputData = result.content;
        contentType = 'text/csv';
        resultInfo = { tablesExtracted: result.tables };
        break;
      }

      case 'compress': {
        const result = await compressPdf(pdfBytes);
        outputFileName = `compressed/${user_id}/${Date.now()}_compressed_${file_name}`;
        outputData = result.data;
        contentType = 'application/pdf';
        resultInfo = {
          originalSize: result.originalSize,
          newSize: result.newSize,
          reduction: `${((1 - result.newSize / result.originalSize) * 100).toFixed(1)}%`
        };
        break;
      }

      case 'extract-text': {
        const result = await processPdfToExcel(pdfBytes, file_name);
        outputFileName = `text/${user_id}/${Date.now()}_${file_name.replace('.pdf', '.txt')}`;
        outputData = result.content;
        contentType = 'text/plain';
        resultInfo = { charCount: result.content.length };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown tool: ' + tool }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Upload result to storage
    const { error: uploadError } = await supabase
      .storage
      .from('pdf-edits')
      .upload(outputFileName, outputData, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to upload result: ' + uploadError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('pdf-edits')
      .getPublicUrl(outputFileName);

    // Clean up original file
    await supabase.storage.from('pdf-edits').remove([file_path]);

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl: urlData.publicUrl,
        fileName: outputFileName.split('/').pop(),
        ...resultInfo
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

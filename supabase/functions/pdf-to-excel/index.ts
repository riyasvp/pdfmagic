import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ProcessRequest {
  file_path: string;
  user_id: string;
  file_name: string;
  tool?: string;
}

// Clean PDF text - remove PDF commands and extract readable text
function cleanPdfText(rawText: string): string {
  // Extract text between parentheses (PDF text objects)
  const textMatches = rawText.match(/\(([^)]+)\)/g) || [];

  const cleanedLines: string[] = [];
  textMatches.forEach(match => {
    // Remove parentheses
    let text = match.slice(1, -1);
    // Unescape PDF escape sequences
    text = text
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, '  ')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .trim();

    if (text && text.length > 0) {
      cleanedLines.push(text);
    }
  });

  return cleanedLines.join('\n');
}

// Process PDF to Excel - extracts text and creates structured CSV
async function processPdfToExcel(pdfBytes: ArrayBuffer, fileName: string): Promise<{ content: string; tables: number; textLines: number }> {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const pdfText = decoder.decode(pdfBytes);

  // Extract page count
  const pagesMatch = pdfText.match(/\/Count\s+(\d+)/);
  const pageCount = pagesMatch ? parseInt(pagesMatch[1]) : 1;

  // Extract all text content
  const rawText = cleanPdfText(pdfText);

  // Split into lines
  const textLines = rawText.split('\n').filter(line => line.trim().length > 0);

  // Detect potential tables (lines with commas or tabs)
  let tables = 0;
  const tableLines: string[] = [];
  const otherLines: string[] = [];

  textLines.forEach(line => {
    if (line.includes(',') || line.includes('\t')) {
      tableLines.push(line);
      tables++;
    } else {
      otherLines.push(line);
    }
  });

  // Create CSV content
  const csvRows: string[] = [];

  // Header section
  csvRows.push('PDF to Excel Conversion Report');
  csvRows.push(`Source File,${fileName}`);
  csvRows.push(`Pages,${pageCount}`);
  csvRows.push(`Text Lines Extracted,${textLines.length}`);
  csvRows.push(`Table Rows Detected,${tables}`);
  csvRows.push('');
  csvRows.push(`Generated at,${new Date().toISOString()}`);
  csvRows.push('');
  csvRows.push('=== EXTRACTED TABLE DATA ===');

  // Add detected table data
  if (tableLines.length > 0) {
    tableLines.forEach(line => {
      // Already CSV formatted
      csvRows.push(line);
    });
  }

  csvRows.push('');
  csvRows.push('=== OTHER TEXT CONTENT ===');

  // Add other text content
  otherLines.forEach(line => {
    const escaped = line.includes(',') ? `"${line}"` : line;
    csvRows.push(escaped);
  });

  return {
    content: csvRows.join('\n'),
    tables: tables,
    textLines: textLines.length
  };
}

// Compress PDF
async function compressPdf(pdfBytes: ArrayBuffer): Promise<{ data: Uint8Array; originalSize: number; newSize: number }> {
  const originalSize = pdfBytes.byteLength;
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let pdfText = decoder.decode(pdfBytes);

  // Remove comments (lines starting with %)
  pdfText = pdfText.replace(/%[^\n\r]*[\n\r]/g, '\n');

  // Remove unnecessary whitespace
  pdfText = pdfText.replace(/[ \t]+/g, ' ');
  pdfText = pdfText.replace(/[\n\r]+/g, '\n');

  const encoder = new TextEncoder();
  const compressed = encoder.encode(pdfText);

  return {
    data: compressed,
    originalSize,
    newSize: compressed.length
  };
}

// Extract text only
async function extractText(pdfBytes: ArrayBuffer, fileName: string): Promise<{ content: string; charCount: number }> {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const pdfText = decoder.decode(pdfBytes);

  const cleanText = cleanPdfText(pdfText);

  return {
    content: cleanText,
    charCount: cleanText.length
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
        resultInfo = {
          tablesExtracted: result.tables,
          textLines: result.textLines
        };
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
        const result = await extractText(pdfBytes, file_name);
        outputFileName = `text/${user_id}/${Date.now()}_${file_name.replace('.pdf', '.txt')}`;
        outputData = result.content;
        contentType = 'text/plain';
        resultInfo = { charCount: result.charCount };
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

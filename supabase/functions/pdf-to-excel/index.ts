import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ProcessRequest {
  file_path: string;
  user_id: string;
  file_name: string;
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
    const { file_path, user_id, file_name }: ProcessRequest = await req.json();

    if (!file_path || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing file_path or user_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the PDF from storage
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

    // For now, create a CSV output (Deno Edge Functions have limited PDF libraries)
    const pdfBytes = await fileData.arrayBuffer();
    const fileSize = pdfBytes.byteLength;

    // Create CSV content
    const csvContent = [
      'File Information',
      `Original File,${file_name}`,
      `File Size,${(fileSize / 1024).toFixed(2)} KB`,
      `User ID,${user_id}`,
      '',
      'Note:',
      'Full PDF to Excel conversion requires Python libraries (pdfplumber, openpyxl).',
      'This Edge Function demonstrates the architecture.',
      'For production, consider:',
      '1. Deploy Python backend to Railway/Render',
      '2. Use CloudConvert API',
      '3. Use pdf-lib for basic PDF operations',
    ].join('\n');

    // Upload result to storage
    const outputFileName = `converted/${user_id}/${Date.now()}_${file_name.replace('.pdf', '.csv')}`;
    const csvBytes = new TextEncoder().encode(csvContent);

    const { error: uploadError } = await supabase
      .storage
      .from('pdf-edits')
      .upload(outputFileName, csvBytes, {
        contentType: 'text/csv',
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
        fileSize: fileSize,
        message: 'PDF uploaded successfully. Full conversion requires Python backend.',
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

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY')!;
const groqApiKey = Deno.env.get('GROQ_API_KEY')!;

interface ProcessRequest {
  file_path: string;
  user_id: string;
  file_name: string;
  tool?: string;
}

// Process PDF using Google Gemini AI
async function processWithGemini(
  pdfBytes: ArrayBuffer,
  task: string
): Promise<{ content: string; tables: number; model: string }> {
  
  const base64Pdf = btoa(
    String.fromCharCode(...new Uint8Array(pdfBytes))
  );

  const prompts: Record<string, string> = {
    'pdf-to-excel': `Analyze this PDF and extract ALL tables and structured data as CSV format.
Return ONLY CSV data with headers. No explanations or markdown.`,
    'extract-text': `Extract ALL text from this PDF. Return clean text only.`,
    'summarize': `Summarize this PDF in bullet points. Include key numbers and conclusions.`
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompts[task] || prompts['pdf-to-excel'] },
            { inline_data: { mime_type: 'application/pdf', data: base64Pdf } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  return { content, tables: 0, model: 'Gemini 2.0 Flash' };
}

// Process PDF using Groq (Llama) - text-based processing
async function processWithGroq(
  extractedText: string,
  task: string
): Promise<{ content: string; tables: number; model: string }> {
  
  const prompts: Record<string, string> = {
    'pdf-to-excel': `Convert this PDF text content to a proper CSV format.
Extract any tables, data rows, or structured information.
Return ONLY valid CSV data, no explanations.

PDF Content:
${extractedText}`,
    'extract-text': `Clean and format this extracted PDF text. Fix any formatting issues.
Return the cleaned text only.

Text:
${extractedText}`,
    'summarize': `Summarize this PDF content in bullet points. Include key numbers and findings.

Content:
${extractedText}`
  };

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: prompts[task] || prompts['pdf-to-excel'] }
        ],
        temperature: 0.1,
        max_tokens: 4096
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || '';
  
  return { content, tables: 0, model: 'Groq Llama 3.3 70B' };
}

// Basic PDF text extraction
function extractPdfText(pdfBytes: ArrayBuffer): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const pdfText = decoder.decode(pdfBytes);

  const textMatches = pdfText.match(/\(([^)]+)\)/g) || [];
  
  const cleanedLines: string[] = [];
  textMatches.forEach(match => {
    let text = match.slice(1, -1);
    text = text
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, '  ')
      .trim();
    if (text && text.length > 0) {
      cleanedLines.push(text);
    }
  });

  return cleanedLines.join('\n');
}

// Main processing function with fallback chain
async function processPdf(
  pdfBytes: ArrayBuffer,
  fileName: string,
  task: string
): Promise<{ content: string; tables: number; processedBy: string }> {
  
  // Try Google Gemini first (if API key available)
  if (googleApiKey) {
    try {
      const result = await processWithGemini(pdfBytes, task);
      return { ...result, processedBy: result.model };
    } catch (error) {
      console.log('Gemini failed, trying Groq:', error);
    }
  }

  // Extract text from PDF
  const extractedText = extractPdfText(pdfBytes);
  
  // If we have extracted text, try Groq for intelligent processing
  if (extractedText.trim() && groqApiKey) {
    try {
      const result = await processWithGroq(extractedText, task);
      return { ...result, processedBy: result.model };
    } catch (error) {
      console.log('Groq failed, using basic extraction:', error);
    }
  }

  // Final fallback: return extracted text as-is
  return {
    content: extractedText,
    tables: 0,
    processedBy: 'Basic PDF Extraction'
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
        JSON.stringify({ success: false, error: 'Failed to download file' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const pdfBytes = await fileData.arrayBuffer();

    // Process the PDF
    const result = await processPdf(pdfBytes, file_name, tool);

    // Determine output file details
    const extensions: Record<string, string> = {
      'pdf-to-excel': 'csv',
      'extract-text': 'txt',
      'summarize': 'txt'
    };
    const ext = extensions[tool] || 'csv';
    const contentTypes: Record<string, string> = {
      'pdf-to-excel': 'text/csv',
      'extract-text': 'text/plain',
      'summarize': 'text/plain'
    };
    
    const folder = tool === 'pdf-to-excel' ? 'converted' : tool === 'summarize' ? 'summary' : 'text';
    const outputFileName = `${folder}/${user_id}/${Date.now()}_${file_name.replace('.pdf', `.${ext}`)}`;

    // Upload result
    const { error: uploadError } = await supabase
      .storage
      .from('pdf-edits')
      .upload(outputFileName, result.content, {
        contentType: contentTypes[tool] || 'text/csv',
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to upload result' }),
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
        processedBy: result.processedBy,
        tablesExtracted: result.tables
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

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
  tool: string;
  options?: Record<string, unknown>;
}

// Extract text from PDF bytes
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

// Process with Groq AI
async function processWithGroq(
  extractedText: string,
  tool: string,
  options: Record<string, unknown> = {}
): Promise<{ content: string; model: string }> {
  
  const prompts: Record<string, string> = {
    'to-excel': `Convert this PDF content to CSV format. Extract all tables and data.
Return ONLY valid CSV with headers. No explanations or markdown.

Content:
${extractedText}`,

    'text': `Extract and clean all text from this PDF content.
Return the clean text preserving structure and paragraphs.

Content:
${extractedText}`,

    'summarize': `Summarize this document in a clear, structured format:
- Overview (2-3 sentences)
- Key Points (bullet list)
- Important Numbers/Data
- Conclusions

Content:
${extractedText}`,

    'key-points': `Extract the key points from this document.
Return as a numbered list with the most important points first.

Content:
${extractedText}`,

    'smart-extract': `Extract all structured data from this document including:
- Names, dates, locations
- Numbers, amounts, percentages
- Key terms and definitions
- Table data

Return as structured JSON.

Content:
${extractedText}`,

    'ocr': `Extract all text from this document as if doing OCR.
Return clean, readable text preserving the document structure.

Content:
${extractedText}`,

    'translate': `Translate this content to ${options.language || 'English'}.
Return only the translated text.

Content:
${extractedText}`,

    'grammar-fix': `Fix grammar, spelling, and punctuation in this text.
Improve clarity while preserving the original meaning.

Content:
${extractedText}`,

    'redact': `Identify and redact sensitive information in this text including:
- Names, emails, phone numbers
- Addresses, ID numbers
- Financial information

Replace sensitive data with [REDACTED].

Content:
${extractedText}`,

    'metadata': `Extract metadata from this document:
- Title, Author, Subject
- Creation date, modification date
- Keywords, topics
- Page count, word count

Return as JSON.

Content:
${extractedText}`,

    'compare': `Compare this document content and provide:
- Main topics covered
- Key differences in content
- Unique elements

Content:
${extractedText}`,

    'chat': `Answer questions about this document content.
Be helpful and accurate based only on the provided content.

Content:
${extractedText}
${options.question || 'What is this document about?'}`,

    'markdown': `Convert this document content to clean Markdown format.
Use proper headings, lists, and formatting.

Content:
${extractedText}`,

    'html': `Convert this document content to clean HTML format.
Use proper semantic tags.

Content:
${extractedText}`
  };

  const prompt = prompts[tool] || prompts['text'];

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
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 8192
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const result = await response.json();
  return {
    content: result.choices?.[0]?.message?.content || '',
    model: 'Groq Llama 3.3 70B'
  };
}

// Process with Google Gemini (for PDF files directly)
async function processWithGemini(
  pdfBytes: ArrayBuffer,
  tool: string,
  options: Record<string, unknown> = {}
): Promise<{ content: string; model: string }> {
  
  const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

  const prompts: Record<string, string> = {
    'to-excel': 'Extract all tables from this PDF as CSV format. Return ONLY CSV data.',
    'text': 'Extract all text from this PDF. Return clean text only.',
    'summarize': 'Summarize this PDF with overview, key points, and conclusions.',
    'key-points': 'Extract the top 10 key points from this PDF.',
    'smart-extract': 'Extract all structured data from this PDF as JSON.',
    'ocr': 'Perform OCR and extract all text from this PDF.',
    'translate': `Translate this PDF content to ${options.language || 'English'}.`,
    'grammar-fix': 'Fix grammar and spelling in this PDF content.',
    'redact': 'Redact sensitive information (names, emails, IDs, financial data) from this PDF.'
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompts[tool] || prompts['text'] },
            { inline_data: { mime_type: 'application/pdf', data: base64Pdf } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini error: ${response.status}`);
  }

  const result = await response.json();
  return {
    content: result.candidates?.[0]?.content?.parts?.[0]?.text || '',
    model: 'Gemini 2.0 Flash'
  };
}

// Get output file details based on tool
function getOutputDetails(tool: string, fileName: string): { ext: string; contentType: string; folder: string } {
  const configs: Record<string, { ext: string; contentType: string; folder: string }> = {
    'to-excel': { ext: 'csv', contentType: 'text/csv', folder: 'converted' },
    'text': { ext: 'txt', contentType: 'text/plain', folder: 'text' },
    'summarize': { ext: 'txt', contentType: 'text/plain', folder: 'summary' },
    'key-points': { ext: 'txt', contentType: 'text/plain', folder: 'keypoints' },
    'smart-extract': { ext: 'json', contentType: 'application/json', folder: 'extracted' },
    'ocr': { ext: 'txt', contentType: 'text/plain', folder: 'ocr' },
    'translate': { ext: 'txt', contentType: 'text/plain', folder: 'translated' },
    'grammar-fix': { ext: 'txt', contentType: 'text/plain', folder: 'corrected' },
    'redact': { ext: 'txt', contentType: 'text/plain', folder: 'redacted' },
    'metadata': { ext: 'json', contentType: 'application/json', folder: 'metadata' },
    'compare': { ext: 'txt', contentType: 'text/plain', folder: 'comparison' },
    'markdown': { ext: 'md', contentType: 'text/markdown', folder: 'markdown' },
    'html': { ext: 'html', contentType: 'text/html', folder: 'html' }
  };
  
  return configs[tool] || { ext: 'txt', contentType: 'text/plain', folder: 'output' };
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
    const { file_path, user_id, file_name, tool, options = {} } = body;

    if (!file_path || !user_id || !tool) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the file
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
    let result: { content: string; model: string };

    // Try Gemini first, then Groq
    try {
      result = await processWithGemini(pdfBytes, tool, options);
    } catch (geminiError) {
      console.log('Gemini failed, using Groq:', geminiError);
      const extractedText = extractPdfText(pdfBytes);
      result = await processWithGroq(extractedText, tool, options);
    }

    // Get output file details
    const outputConfig = getOutputDetails(tool, file_name);
    const outputFileName = `${outputConfig.folder}/${user_id}/${Date.now()}_${file_name.replace('.pdf', `.${outputConfig.ext}`)}`;

    // Upload result
    const { error: uploadError } = await supabase
      .storage
      .from('pdf-edits')
      .upload(outputFileName, result.content, {
        contentType: outputConfig.contentType,
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

    // Clean up original
    await supabase.storage.from('pdf-edits').remove([file_path]);

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl: urlData.publicUrl,
        fileName: outputFileName.split('/').pop(),
        processedBy: result.model
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

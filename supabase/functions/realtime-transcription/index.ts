import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioChunk, isLive = true } = await req.json();
    
    if (!audioChunk) {
      throw new Error('No audio chunk provided');
    }

    console.log('Processing real-time audio transcription...');
    
    // Helper to process base64 in chunks for reliability
    function processBase64Chunks(base64String: string, chunkSize = 32768) {
      // Strip potential data URL prefix
      const clean = base64String.includes(',') ? base64String.split(',')[1] : base64String;
      const chunks: Uint8Array[] = [];
      let position = 0;
      while (position < clean.length) {
        const piece = clean.slice(position, position + chunkSize);
        const binary = atob(piece);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        chunks.push(bytes);
        position += chunkSize;
      }
      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
      const result = new Uint8Array(totalLen);
      let offset = 0;
      for (const c of chunks) { result.set(c, offset); offset += c.length; }
      return result;
    }

    // Convert base64 to binary (chunked)
    const bytes = processBase64Chunks(audioChunk);
    
    // Require a reasonable size (>= 8KB) to avoid malformed containers
    if (bytes.length < 8192) {
      console.log(`Audio chunk too small (${bytes.length} bytes), skipping transcription`);
      return new Response(
        JSON.stringify({ 
          text: '',
          speaker: 'לקוח',
          timestamp: new Date().toISOString(),
          confidence: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Prepare form data for OpenAI Whisper
    const formData = new FormData();
    const file = new File([bytes], 'chunk.webm', { type: 'audio/webm' });
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    formData.append('language', 'he'); // Hebrew language
    formData.append('response_format', 'json');
    formData.append('temperature', '0.2'); // Lower temperature for more consistent results

    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const transcribedText = result.text;

    if (!transcribedText || transcribedText.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          text: '', 
          confidence: 0,
          speaker: 'unknown'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simple speaker detection based on common patterns
    let speaker = 'לקוח'; // Default to client
    const agentKeywords = [
      'שלום', 'איך אפשר לעזור', 'אני רוצה להמליץ', 'נראה לי', 'מה דעתך',
      'אני חושב', 'לפי הניסיון שלי', 'אני מציע', 'בואו נבדוק'
    ];
    
    const clientKeywords = [
      'אני מעוניין', 'כמה זה עולה', 'מה זה אומר', 'לא הבנתי', 
      'אני רוצה', 'איך זה עובד', 'תוכל להסביר'
    ];

    const lowerText = transcribedText.toLowerCase();
    
    if (agentKeywords.some(keyword => lowerText.includes(keyword))) {
      speaker = 'סוכן';
    } else if (clientKeywords.some(keyword => lowerText.includes(keyword))) {
      speaker = 'לקוח';
    }

    console.log(`Transcription successful - Speaker: ${speaker}, Text: ${transcribedText.substring(0, 50)}...`);

    return new Response(
      JSON.stringify({ 
        text: transcribedText,
        confidence: result.confidence || 0.8,
        speaker: speaker,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in realtime-transcription function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
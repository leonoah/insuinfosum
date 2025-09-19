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
    
    // Convert base64 to binary
    const binaryString = atob(audioChunk);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Check if chunk is too small (less than 1KB) - skip transcription
    if (bytes.length < 1024) {
      console.log('Audio chunk too small, skipping transcription');
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
    const blob = new Blob([bytes], { type: 'audio/webm; codecs=opus' });
    formData.append('file', blob, 'chunk.webm');
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
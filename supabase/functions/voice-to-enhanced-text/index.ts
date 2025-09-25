import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, textType } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    if (!textType) {
      throw new Error('Text type is required (currentSituation or risks)');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing audio for text type:', textType);

    // Step 1: Transcribe audio to text
    const binaryAudio = processBase64Chunks(audio);
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'he');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      throw new Error(`Transcription failed: ${error}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcribedText = transcriptionResult.text;
    
    console.log('Transcribed text:', transcribedText);

    if (!transcribedText || transcribedText.trim() === '') {
      throw new Error('לא זוהה טקסט בהקלטה');
    }

    // Step 2: Enhance the text based on type
    let systemPrompt = '';
    if (textType === 'currentSituation') {
      systemPrompt = `אתה סוכן ביטוח מקצועי. המטרה שלך היא לקחת טקסט גולמי של מצב ביטוחי נוכחי של לקוח ולעצב אותו בצורה מקצועית וברורה.

הנחיות:
- כתב בעברית בלבד
- השתמש במשפטים קצרים וברורים
- התמקד בפרטים הביטוחיים החשובים
- הבהר פוליסות קיימות, סכומי ביטוח, דמי ביטוח
- הוסף מבנה והגיון לטקסט
- שמור על כל המידע החשוב מהטקסט המקורי
- כתב בצורה מקצועית אבל מובנת

דוגמה: "הלקוח מבוטח כיום בפוליסת חיים בסך 500,000 ש"ח, דמי ביטוח חודשיים של 150 ש"ח. בנוסף יש לו ביטוח בריאות פרטי עם כיסוי בסיסי."`;
    } else if (textType === 'risks') {
      systemPrompt = `אתה סוכן ביטוח מקצועי. המטרה שלך היא לקחת טקסט גולמי על פערים וסיכונים ביטוחיים ולעצב אותו בצורה מקצועית.

הנחיות:
- כתב בעברית בלבד
- התמקד בזיהוי פערי כיסוי וסיכונים פוטנציאליים
- הבהר את החשיבות של הטיפול בכל פער
- השתמש במשפטים קצרים וברורים
- הוסף מבנה עם נקודות או מספור אם נדרש
- התמקד בהשלכות אפשריות של אי טיפול בסיכונים
- כתב בצורה מקצועית אבל מובנת

דוגמה: "זוהו מספר פערים חשובים: 1. חוסר כיסוי לאובדן כושר עבודה - עלול לגרום לקושי כלכלי משמעותי. 2. סכום ביטוח החיים נמוך יחסית להכנסה - לא יספק הגנה מספקת למשפחה."`;
    }

    const enhanceResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `עצב את הטקסט הבא: "${transcribedText}"` }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!enhanceResponse.ok) {
      const error = await enhanceResponse.text();
      throw new Error(`Text enhancement failed: ${error}`);
    }

    const enhanceResult = await enhanceResponse.json();
    const enhancedText = enhanceResult.choices[0].message.content;

    console.log('Enhanced text:', enhancedText);

    return new Response(
      JSON.stringify({ 
        transcribedText,
        enhancedText,
        textType 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in voice-to-enhanced-text function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
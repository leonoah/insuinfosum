import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `אתה עוזר מומחה בתחום הביטוח בישראל. המשימה שלך היא ליצור מידע מפורט על חברות ביטוח ומוצריהם בפורמט JSON.

החזר תמיד מידע בפורמט הבא:
{
  "שם_חברה": "שם החברה",
  "קטגוריה": "חברת ביטוח",
  "מוצרים": [
    {
      "שם": "שם המוצר",
      "תתי_סוגים": ["רשימת תתי-סוגים"]
    }
  ],
  "הערות": "הערות נוספות (אופציונלי)"
}

דוגמאות למוצרי ביטוח נפוצים בישראל:
- פנסיה (תתי-סוגים: ברירת מחדל, מסלול כללי, מסלול מניות, מסלול אג"ח, הלכתי/שרעי)
- ביטוח מנהלים (תתי-סוגים: קצבה, ריסק + חיסכון, ריסק טהור)
- קופת גמל (תתי-סוגים: מסלול כללי, מניות, אג"ח, הלכתי/שרעי)
- קופת גמל להשקעה (תתי-סוגים: כללי, מניות, אג"ח, מניות חו"ל)
- קרן השתלמות (תתי-סוגים: כללי, מניות, אג"ח, הלכתי/שרעי)
- ביטוח חיים (תתי-סוגים: קבוע, משתנה, הלכתי/שרעי)
- בריאות (תתי-סוגים: בסיסי, מורחב, פרימיום)
- סיעוד (תתי-סוגים: בסיסי, מורחב)
- אובדן כושר עבודה (תתי-סוגים: זמני, קבוע, חלקי)
- רכב (תתי-סוגים: חובה, מקיף, צד ג')
- דירה/תכולה (תתי-סוגים: דירה, תכולה, משולב)
- נסיעות לחו"ל (תתי-סוגים: בסיסי, מורחב, משפחתי)
- פוליסת חיסכון/השקעה (תתי-סוגים: כללי, מניות, אג"ח)

אם החברה לא קיימת או אם המשתמש מבקש מידע כללי, צור מידע הגיוני ומציאותי.
החזר רק JSON תקני ללא הסברים נוספים.` 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated from OpenAI');
    }

    // Try to parse the generated text as JSON
    let company;
    try {
      // Clean the response - remove any markdown formatting
      const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      company = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse generated JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate valid company data' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Generated company data:', company);

    return new Response(
      JSON.stringify({ 
        company,
        rawText: generatedText
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-insurance-info function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});